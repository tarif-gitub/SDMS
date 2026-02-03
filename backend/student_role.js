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
      const insertSql = `INSERT INTO Student_Profile (User_ID, Phone, Email, Date_Of_Birth, Blood_Group, Address) 
                         VALUES ($1, $2, $3, $4, $5, $6)
                         ON CONFLICT (User_ID) DO UPDATE SET 
                         Phone = $2, Email = $3, Address = $6`;
      await client.query(insertSql, [userData.id, userData.phone, userData.email, userData.dob, userData.blood, userData.address]);
      console.log("Profile Inserted or Updated");
    } 
    else if (operation === 'update') {
      const updateSql = `UPDATE Student_Profile 
                         SET Phone = $1, Email = $2, Address = $3 
                         WHERE User_ID = $4`;
      await client.query(updateSql, [userData.phone, userData.email, userData.address, userData.id]);
      console.log("Profile Updated");
    }

    const res = await client.query('SELECT * FROM Student_Profile WHERE User_ID = $1', [userData.id]);
    console.log(res.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

const data = { id: 101, phone: '01711223344', email: 'student@example.com', dob: '2000-01-01', blood: 'O+', address: 'Dhaka' };
run('insert', data);