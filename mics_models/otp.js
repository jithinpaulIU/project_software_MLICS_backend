const OTP = {
  create: async (doctorId, patientSSN, patientEmail, otp, expiresAt) => {
    console.log(doctorId, patientSSN, patientEmail, otp, expiresAt);
    const result = await db.query(
      "INSERT INTO otp_requests (doctor_id, patient_ssn, patient_email, otp, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [doctorId, patientSSN, patientEmail, otp, expiresAt]
    );
    return result.rows[0];
  },

  findByDetails: async (doctorId, patientSSN, patientEmail, otp) => {
    const result = await db.query(
      "SELECT * FROM otp_requests WHERE doctor_id = $1 AND patient_ssn = $2 AND patient_email = $3 AND otp = $4 AND is_used = false AND expires_at > NOW()",
      [doctorId, patientSSN, patientEmail, otp]
    );
    return result.rows[0];
  },

  markAsUsed: async (id) => {
    await db.query("UPDATE otp_requests SET is_used = true WHERE id = $1", [
      id,
    ]);
    return true;
  },
};

module.exports = OTP;
