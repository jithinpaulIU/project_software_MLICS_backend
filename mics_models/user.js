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

  findByEmail: async (email) => {
    const result = await db.query(
      "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL",
      [email]
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
      "SELECT id, first_name, last_name, username, email, phone, status, ssn, country_code FROM users WHERE role = 'Doctor' AND deleted_at IS NULL"
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
    const { firstName, lastName, username, phone, countryCode } = userData;

    // First check if the user exists and isn't soft-deleted
    const checkResult = await db.query(
      "SELECT deleted_at FROM users WHERE id = $1",
      [id]
    );

    if (checkResult.rows.length === 0) {
      throw new Error("User not found");
    }

    if (checkResult.rows[0].deleted_at !== null) {
      throw new Error("Update not possible - user is deactivated");
    }

    // Proceed with update if not soft-deleted
    const result = await db.query(
      `UPDATE users 
     SET first_name = $1, 
         last_name = $2, 
         username = $3, 
         phone = $4, 
         country_code = $5, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $6 
     AND deleted_at IS NULL
     RETURNING *`,
      [firstName, lastName, username, phone, countryCode, id]
    );

    if (result.rows.length === 0) {
      throw new Error(
        "Update failed - user may have been deactivated during the operation"
      );
    }

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

  // NEW: Authentication Method
  authenticate: async (email, password) => {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    // Compare plaintext password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    return user;
  },
};

module.exports = User;
