const db = require("../config/db");

const Doctor = {
  requestAuthentication: async (doctorId) => {
    const result = await db.query(
      "INSERT INTO auth_requests (doctor_id) VALUES ($1) RETURNING *",
      [doctorId]
    );
    return result.rows[0];
  },

  getAuthRequests: async () => {
    const result = await db.query(
      `SELECT ar.id, ar.status, ar.created_at, 
       u.first_name, u.last_name, u.email, u.phone 
       FROM auth_requests ar
       JOIN users u ON ar.doctor_id = u.id`
    );
    return result.rows;
  },
};

module.exports = Doctor;
