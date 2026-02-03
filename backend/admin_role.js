const { Client } = require('pg');

const config = {
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '@postgres123',
  port: 5432,
};

async function run() {
  const client = new Client(config);
  try {
    await client.connect();

    await client.query('BEGIN');

   const deptSql = `INSERT INTO Department (Dept_ID, Dept_Name) VALUES ($1, $2) ON CONFLICT (Dept_ID) DO NOTHING`;
   await client.query(deptSql, [1, 'Computer Science and Engineering']);

    const userSql = `INSERT INTO App_User (User_ID, Password, Role, Account_status) VALUES ($1, $2, $3, $4) ON CONFLICT (User_ID) DO NOTHING`;
    await client.query(userSql, [502, 'pass123', 'Teacher', 'Active']);
    await client.query(userSql, [102, 'pass456', 'Student', 'Active']);

    const teacherCoreSql = `INSERT INTO Teacher_Core (User_ID, Name, Designation, Dept_ID) 
                            VALUES ($1, $2, $3, $4) ON CONFLICT (User_ID) DO NOTHING`;
    await client.query(teacherCoreSql, [502, 'Dr. Ariful Islam', 'Professor', 1]);

    const studentCoreSql = `INSERT INTO Student_Core (User_ID, Name, Hall_Name, Total_credit_earned, Dept_ID, Advisor_ID) 
                            VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (User_ID) DO NOTHING`;
    await client.query(studentCoreSql, [102, 'Rakib Ahmed', 'Ahsanullah Hall', 0.0, 1, 502]);

    await client.query('COMMIT');

    const students = await client.query('SELECT * FROM Student_Core');
    console.log(students.rows);

    const teachers = await client.query('SELECT * FROM Teacher_Core');
    console.log(teachers.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
  } finally {
    await client.end();
  }
}

run();