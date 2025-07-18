const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_4rgnlbaeocx5@ep-small-fire-a2blxpq2-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
