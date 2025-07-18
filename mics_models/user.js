const db = require("../config/db");
const bcrypt = require("bcryptjs");

const User = {
  create: async (userData) => {
    const {
      firstName,
      lastName,
      username,
      ssn,
      email,
      password,
      phone,
      countryCode,
      role,
    } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      "INSERT INTO users (first_name, last_name, username, ssn, email, password, phone, country_code, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        firstName,
        lastName,
        username,
        ssn,
        email,
        hashedPassword,
        phone,
        countryCode,
        role,
      ]
    );
    return result.rows[0];
  },

  findByUsername: async (username) => {
    const result = await db.query(
      "SELECT * FROM users WHERE username = $1 AND deleted_at IS NULL",
      [username]
    );
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await db.query(
      "SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
    return result.rows[0];
  },

  findBySSN: async (ssn) => {
    const result = await db.query(
      "SELECT * FROM users WHERE ssn = $1 AND deleted_at IS NULL",
      [ssn]
    );
    return result.rows[0];
  },

  getAllDoctors: async () => {
    const result = await db.query(
      "SELECT id, first_name, last_name, username, email, phone, status, ssn FROM users WHERE role = 'Doctor' AND deleted_at IS NULL"
    );
    return result.rows;
  },

  softDelete: async (id) => {
    const result = await db.query(
      "UPDATE users SET deleted_at = CURRENT_TIMESTAMP, status = $1 WHERE id = $2 RETURNING *",
      ["deleted", id]
    );
    return result.rows[0];
  },

  update: async (id, userData) => {
    const { firstName, lastName, username, phone } = userData;
    const result = await db.query(
      "UPDATE users SET first_name = $1, last_name = $2, username = $3, phone = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
      [firstName, lastName, username, phone, id]
    );
    return result.rows[0];
  },

  updatePassword: async (id, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      id,
    ]);
    return true;
  },
};

module.exports = User;
