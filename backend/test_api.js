(async () => {
  const base = 'http://localhost:5000/api';
  const headers = { 'Content-Type': 'application/json' };
  try {
    const post = async (path, body) => {
      const res = await fetch(base + path, { method: 'POST', headers, body: JSON.stringify(body) });
      const text = await res.text();
      console.log(path, res.status, text);
      return res;
    };
    const get = async (path) => {
      const res = await fetch(base + path);
      const text = await res.text();
      console.log(path, res.status, text);
      return res;
    };

    await post('/course', { title: 'Intro to AI', creditHours: 3.0, type: 'Core', targetLevel: 1, targetTerm: 1, deptId: 1 });
    await post('/course/section', { courseId: 1, sectionId: 1, sectionName: 'A', semesterId: null });
    await post('/enroll', { userId: 101, courseId: 1, sectionId: 1 });
    await post('/result', { userId: 101, courseId: 1, sectionId: 1, obtainedMarks: 85.5, gradePoints: 3.7, attendancePercent: 95.0 });
    await post('/student/payment', { userId: 101, amountPaid: 500.00, due: 0.00, status: 'Paid', feeId: null });

    await get('/courses');
    await get('/course/sections/1');
    await get('/student/enrollments/101');
    await get('/student/results/101');
    await get('/student/payments/101');

    console.log('Tests finished');
  } catch (err) {
    console.error('Error during tests:', err.message);
    process.exit(1);
  }
})();
