const db = require("../config/db");
const bcrypt = require("bcrypt");

const Lab = {
  create: async (labData, adminId) => {
    const { name, address, email, username, password, phone } = labData;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO labs (
        name, 
        address, 
        email, 
        username, 
        password, 
        phone, 
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING 
        id,
        name,
        address,
        email,
        username,
        phone,
        status,
        total_req AS "totalReq",
        success_rate AS "successRate",
        created_at AS "createdAt"`,
      [name, address, email, username, hashedPassword, phone, adminId]
    );
    return result.rows[0];
  },

  getAll: async () => {
    const result = await db.query(
      `SELECT 
        id,
        name,
        address,
        email,
        username,
        phone,
        status,
        total_req AS "totalReq",
        success_rate AS "successRate",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM labs 
      WHERE deleted_at IS NULL`
    );
    return result.rows;
  },

  update: async (id, labData) => {
    const { name, address, phone } = labData;
    const result = await db.query(
      `UPDATE labs 
      SET 
        name = $1, 
        address = $2, 
        phone = $3, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $4 
      RETURNING 
        id,
        name,
        address,
        email,
        username,
        phone,
        status,
        total_req AS "totalReq",
        success_rate AS "successRate",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [name, address, phone, id]
    );
    return result.rows[0];
  },

  softDelete: async (id) => {
    const result = await db.query(
      `UPDATE labs 
      SET 
        deleted_at = CURRENT_TIMESTAMP, 
        status = 'deleted' 
      WHERE id = $1 
      RETURNING id, name, status, deleted_at AS "deletedAt"`,
      [id]
    );
    return result.rows[0];
  },

  incrementRequests: async (id) => {
    await db.query("UPDATE labs SET total_req = total_req + 1 WHERE id = $1", [
      id,
    ]);
    return true;
  },
};

module.exports = Lab;
