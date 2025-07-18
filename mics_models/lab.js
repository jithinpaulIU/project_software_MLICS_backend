const db = require("../config/db");

const Lab = {
  create: async (labData, adminId) => {
    const { name, address, email, password, contactNumber } = labData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO labs (name, address, contact_number, email, password, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, address, contactNumber, email, hashedPassword, adminId]
    );
    return result.rows[0];
  },

  getAll: async () => {
    const result = await db.query(
      "SELECT id, name, address, email, contact_number as contactNumber, status, total_requests as totalReq, success_rate as successRate, created_at as createdAt FROM labs WHERE deleted_at IS NULL"
    );
    return result.rows;
  },

  update: async (id, labData) => {
    const { name, address, contactNumber } = labData;
    const result = await db.query(
      "UPDATE labs SET name = $1, address = $2, contact_number = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *",
      [name, address, contactNumber, id]
    );
    return result.rows[0];
  },

  softDelete: async (id) => {
    const result = await db.query(
      "UPDATE labs SET deleted_at = CURRENT_TIMESTAMP, status = $1 WHERE id = $2 RETURNING *",
      ["deleted", id]
    );
    return result.rows[0];
  },

  incrementRequests: async (id) => {
    await db.query(
      "UPDATE labs SET total_requests = total_requests + 1 WHERE id = $1",
      [id]
    );
    return true;
  },
};

module.exports = Lab;
