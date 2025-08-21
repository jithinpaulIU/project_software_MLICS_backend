const db = require("../config/db");

const ServiceRequest = {
  create: async (doctorId, patientSSN, patientPhone, type) => {
    const result = await db.query(
      "INSERT INTO requests (doctor_id, patient_ssn, patient_phone, type) VALUES ($1, $2, $3, $4) RETURNING *",
      [doctorId, patientSSN, patientPhone, type]
    );
    return result.rows[0];
  },

  getByDoctor: async (doctorId) => {
    const result = await db.query(
      "SELECT * FROM requests WHERE doctor_id = $1 ORDER BY created_at DESC",
      [doctorId]
    );
    return result.rows;
  },

  getAll: async () => {
    const result = await db.query(
      `SELECT sr.id, sr.patient_ssn, sr.patient_phone, sr.type, sr.created_at,
       u.first_name as doctor_first_name, u.last_name as doctor_last_name
       FROM requests sr
       JOIN users u ON sr.doctor_id = u.id
       ORDER BY sr.created_at DESC`
    );
    return result.rows;
  },
};

module.exports = ServiceRequest;
