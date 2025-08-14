const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const OTP = {
  /**
   * Create a new OTP request
   * @param {number} doctor_id
   * @param {string} ssn
   * @param {string} email
   * @param {string} otp
   * @param {string} request_type
   * @returns {Promise<Object>} The created OTP record
   */
  create: async (doctor_id, ssn, email, otp, request_type) => {
    console.log(
      "request_type",

      request_type
    );
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const result = await db.query(
      `INSERT INTO otp_requests 
   (doctor_id, ssn, email, otp, request_type, expires_at) 
   VALUES ($1, $2, $3, $4, $5, $6) 
   RETURNING id, doctor_id, ssn, email, otp, request_type, created_at, expires_at`,
      [doctor_id, ssn, email, otp, request_type, expiresAt]
    );

    return result.rows[0];
  },

  /**
   * Find a valid OTP by details
   * @param {number} doctor_id
   * @param {string} ssn
   * @param {string} email
   * @param {string} otp
   * @returns {Promise<Object|null>} The OTP record if found
   */
  findByDetails: async (doctor_id, ssn, email, otp) => {
    console.log("doctor_id, ssn, email, otp", doctor_id, ssn, email, otp);
    const result = await db.query(
      `SELECT id, doctor_id, ssn, email, otp, request_type, status, created_at, expires_at
       FROM otp_requests 
       WHERE doctor_id = $1 
         AND ssn = $2 
         AND email = $3 
         AND otp = $4 
         AND status = 'pending'
         AND expires_at > NOW()`,
      [doctor_id, ssn, email, otp]
    );

    return result.rows[0] || null;
  },

  /**
   * Mark OTP as used by updating status
   * @param {number} id
   * @returns {Promise<boolean>} True if updated successfully
   */
  markAsUsed: async (id) => {
    const result = await db.query(
      `UPDATE otp_requests 
       SET status = 'used' 
       WHERE id = $1`,
      [id]
    );

    return result.rowCount > 0;
  },

  /**
   * Clean up expired OTPs
   * @returns {Promise<number>} Number of deleted records
   */
  cleanupExpired: async () => {
    const result = await db.query(
      `DELETE FROM otp_requests 
       WHERE expires_at <= NOW() 
         AND status = 'pending'`
    );

    return result.rowCount;
  },

  /**
   * Get active OTPs for a patient
   * @param {string} ssn
   * @returns {Promise<Array>} List of active OTP records
   */
  getActiveForPatient: async (ssn) => {
    const result = await db.query(
      `SELECT id, doctor_id, ssn, email, otp, request_type, status, created_at, expires_at
       FROM otp_requests
       WHERE ssn = $1
         AND status = 'pending'
         AND expires_at > NOW()`,
      [ssn]
    );

    return result.rows;
  },
};

module.exports = OTP;
