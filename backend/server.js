const express = require('express');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(require('path').join(__dirname, '../frontend')));

// Database configuration
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '@postgres123',
  port: 5432,
};

// Database connection pool
const client = new Client(dbConfig);

// Connect to database
client.connect((err) => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL');
  }
});

// ============ AUTH ROUTES ============

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { role, userId, password } = req.body;

  try {
    if (!role || !userId || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const result = await client.query('SELECT * FROM App_User WHERE User_ID = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({ success: true, user: { userId, role, status: user.account_status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ADMIN ROUTES ============

// Add Department
app.post('/api/admin/department', async (req, res) => {
  const { deptId, deptName } = req.body;

  try {
    const result = await client.query(
      'INSERT INTO Department (Dept_ID, Dept_Name) VALUES ($1, $2) ON CONFLICT (Dept_ID) DO NOTHING RETURNING *',
      [deptId, deptName]
    );
    
    res.json({ success: true, message: 'Department added', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Departments
app.get('/api/admin/departments', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM Department');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Teacher
app.post('/api/admin/teacher', async (req, res) => {
  const { userId, password, name, designation, deptId } = req.body;

  try {
    await client.query('BEGIN');

    // Create App_User
    await client.query(
      'INSERT INTO App_User (User_ID, Password, Role, Account_status) VALUES ($1, $2, $3, $4) ON CONFLICT (User_ID) DO NOTHING',
      [userId, password, 'Teacher', 'Active']
    );

    // Create Teacher_Core
    const result = await client.query(
      'INSERT INTO Teacher_Core (User_ID, Name, Designation, Dept_ID) VALUES ($1, $2, $3, $4) ON CONFLICT (User_ID) DO UPDATE SET Name = $2, Designation = $3, Dept_ID = $4 RETURNING *',
      [userId, name, designation, deptId]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: 'Teacher added', data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// Get All Teachers
app.get('/api/admin/teachers', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM Teacher_Core');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Student
app.post('/api/admin/student', async (req, res) => {
  const { userId, password, name, hallName, deptId, advisorId } = req.body;

  try {
    await client.query('BEGIN');

    // Create App_User
    await client.query(
      'INSERT INTO App_User (User_ID, Password, Role, Account_status) VALUES ($1, $2, $3, $4) ON CONFLICT (User_ID) DO NOTHING',
      [userId, password, 'Student', 'Active']
    );

    // Create Student_Core
    const result = await client.query(
      'INSERT INTO Student_Core (User_ID, Name, Hall_Name, Total_credit_earned, Dept_ID, Advisor_ID) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (User_ID) DO UPDATE SET Name = $2, Hall_Name = $3, Advisor_ID = $6 RETURNING *',
      [userId, name, hallName, 0.0, deptId, advisorId]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: 'Student added', data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// Get All Students
app.get('/api/admin/students', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM Student_Core');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Statistics
app.get('/api/admin/statistics', async (req, res) => {
  try {
    const depts = await client.query('SELECT COUNT(*) FROM Department');
    const teachers = await client.query('SELECT COUNT(*) FROM Teacher_Core');
    const students = await client.query('SELECT COUNT(*) FROM Student_Core');

    res.json({
      success: true,
      data: {
        departments: depts.rows[0].count,
        teachers: teachers.rows[0].count,
        students: students.rows[0].count,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ TEACHER ROUTES ============

// Get Teacher Profile
app.get('/api/teacher/profile/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const core = await client.query('SELECT * FROM Teacher_Core WHERE User_ID = $1', [userId]);
    const profile = await client.query('SELECT * FROM Teacher_Profile WHERE User_ID = $1', [userId]);

    if (core.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json({
      success: true,
      data: {
        core: core.rows[0],
        profile: profile.rows[0] || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Teacher Profile
app.post('/api/teacher/profile/update', async (req, res) => {
  const { userId, phone, email, roomNo, researchInterest } = req.body;

  try {
    const result = await client.query(
      `INSERT INTO Teacher_Profile (User_ID, Phone, Email, Room_No, Research_Interest) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (User_ID) DO UPDATE SET 
       Phone = $2, Email = $3, Room_No = $4, Research_Interest = $5
       RETURNING *`,
      [userId, phone, email, roomNo, researchInterest]
    );

    res.json({ success: true, message: 'Profile updated', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Teacher's Students
app.get('/api/teacher/students/:teacherId', async (req, res) => {
  const { teacherId } = req.params;

  try {
    const result = await client.query(
      'SELECT * FROM Student_Core WHERE Advisor_ID = $1',
      [teacherId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ STUDENT ROUTES ============

// Get Student Profile
app.get('/api/student/profile/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const core = await client.query('SELECT * FROM Student_Core WHERE User_ID = $1', [userId]);
    const profile = await client.query('SELECT * FROM Student_Profile WHERE User_ID = $1', [userId]);

    if (core.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      data: {
        core: core.rows[0],
        profile: profile.rows[0] || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Student Profile
app.post('/api/student/profile/update', async (req, res) => {
  const { userId, phone, email, dob, bloodGroup, address } = req.body;

  try {
    const result = await client.query(
      `INSERT INTO Student_Profile (User_ID, Phone, Email, Date_Of_Birth, Blood_Group, Address) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (User_ID) DO UPDATE SET 
       Phone = $2, Email = $3, Date_Of_Birth = $4, Blood_Group = $5, Address = $6
       RETURNING *`,
      [userId, phone, email, dob, bloodGroup, address]
    );

    res.json({ success: true, message: 'Profile updated', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Student Advisor Info
app.get('/api/student/advisor/:advisorId', async (req, res) => {
  const { advisorId } = req.params;

  try {
    const result = await client.query(
      'SELECT * FROM Teacher_Core WHERE User_ID = $1',
      [advisorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Advisor not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ UTILITY ROUTES ============

// ============ COURSE & ENROLLMENT ROUTES ============

// Create Course
app.post('/api/course', async (req, res) => {
  const { title, creditHours, type, targetLevel, targetTerm, deptId } = req.body;
  try {
    const result = await client.query(
      `INSERT INTO Course_Master (Title, Credit_Hours, Type, Target_Level, Target_Term, Dept_ID)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, creditHours, type, targetLevel, targetTerm, deptId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List Courses
app.get('/api/courses', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM Course_Master');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Course Section
app.post('/api/course/section', async (req, res) => {
  const { courseId, sectionId, sectionName, semesterId } = req.body;
  try {
    const result = await client.query(
      `INSERT INTO Course_Section (Course_ID, Section_ID, Section_Name, Semester_ID)
       VALUES ($1, $2, $3, $4) ON CONFLICT (Course_ID, Section_ID) DO NOTHING RETURNING *`,
      [courseId, sectionId, sectionName, semesterId]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sections for a course
app.get('/api/course/sections/:courseId', async (req, res) => {
  const { courseId } = req.params;
  try {
    const result = await client.query('SELECT * FROM Course_Section WHERE Course_ID = $1', [courseId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enroll a student in a section
app.post('/api/enroll', async (req, res) => {
  const { userId, courseId, sectionId } = req.body;
  try {
    const result = await client.query(
      `INSERT INTO Enrolls (User_ID, Course_ID, Section_ID) VALUES ($1, $2, $3)
       ON CONFLICT (User_ID, Course_ID, Section_ID) DO NOTHING RETURNING *`,
      [userId, courseId, sectionId]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get student enrollments
app.get('/api/student/enrollments/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await client.query('SELECT * FROM Enrolls WHERE User_ID = $1', [userId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ RESULTS & PAYMENTS ============

// Submit/Update Result
app.post('/api/result', async (req, res) => {
  const { userId, courseId, sectionId, obtainedMarks, gradePoints, attendancePercent } = req.body;
  try {
    const result = await client.query(
      `INSERT INTO Result (User_ID, Course_ID, Section_ID, Obtained_marks, Grade_points, Attendance_percent)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (User_ID, Course_ID, Section_ID) DO UPDATE SET
       Obtained_marks = $4, Grade_points = $5, Attendance_percent = $6 RETURNING *`,
      [userId, courseId, sectionId, obtainedMarks, gradePoints, attendancePercent]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get student results
app.get('/api/student/results/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await client.query('SELECT * FROM Result WHERE User_ID = $1', [userId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record Student Payment
app.post('/api/student/payment', async (req, res) => {
  const { userId, amountPaid, due, status, feeId } = req.body;
  try {
    const result = await client.query(
      `INSERT INTO Student_Payment (User_ID, Amount_paid, Due, Status, Fee_ID)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, amountPaid, due, status, feeId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payments for a student
app.get('/api/student/payments/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await client.query('SELECT * FROM Student_Payment WHERE User_ID = $1', [userId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n✅ Server started on http://localhost:${PORT}`);
  console.log('📚 Student Management System API is running...\n');
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  client.end();
  process.exit(0);
});
