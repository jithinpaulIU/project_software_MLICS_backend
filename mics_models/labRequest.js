const db = require("../config/db");

const LabRequest = {
  create: async (labId, doctorId, patientSSN, patientMobile, authToken) => {
    const result = await db.query(
      "INSERT INTO lab_requests (lab_id, doctor_id, patient_ssn, patient_mobile, auth_token) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [labId, doctorId, patientSSN, patientMobile, authToken]
    );
    return result.rows[0];
  },

  getLabRequests: async () => {
    const result = await db.query(
      `SELECT lr.id, lr.patient_ssn, lr.patient_mobile, lr.status, lr.created_at,
       l.name as lab_name, d.first_name as doctor_first_name, d.last_name as doctor_last_name
       FROM lab_requests lr
       JOIN labs l ON lr.lab_id = l.id
       JOIN users d ON lr.doctor_id = d.id`
    );
    return result.rows;
  },
};

module.exports = LabRequest;
