const { Client } = require('pg');

const config = {
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '@postgres123',
  port: 5432,
};

async function run(operation, userData) {
  const client = new Client(config);
  try {
    await client.connect();

    if (operation === 'insert') {
      const insertSql = `INSERT INTO Teacher_Profile (User_ID, Phone, Email, Room_No, Research_Interest) 
                         VALUES ($1, $2, $3, $4, $5)
                         ON CONFLICT (User_ID) DO UPDATE SET 
                         Phone = $2, Email = $3, Room_No = $4, Research_Interest = $5`;
      await client.query(insertSql, [userData.id, userData.phone, userData.email, userData.room, userData.research]);
      console.log("Profile Inserted or Updated");
    } 
    else if (operation === 'update') {
      const updateSql = `UPDATE Teacher_Profile 
                         SET Phone = $1, Email = $2, Room_No = $3, Research_Interest = $4 
                         WHERE User_ID = $5`;
      await client.query(updateSql, [userData.phone, userData.email, userData.room, userData.research, userData.id]);
      console.log("Profile Updated");
    }

    const res = await client.query('SELECT * FROM Teacher_Profile WHERE User_ID = $1', [userData.id]);
    console.log(res.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

const data = { id: 501, phone: '01811223344', email: 'teacher@example.com', room: 'A-505', research: 'Data Science' };
run('insert', data);