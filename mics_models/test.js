const db = require("../config/db");

const Test = {
  getTestsByLab: async (labId) => {
    const result = await db.query("SELECT * FROM tests WHERE lab_id = $1", [
      labId,
    ]);
    return result.rows;
  },

  getTestResults: async (patientSSN, patientMobile, authToken) => {
    const result = await db.query(
      `SELECT tr.id, t.name as test_name, tr.test_type as type, tr.result, 
       tr.tested_on as tested_on, tr.status, tr.result_url as url
       FROM test_results tr
       JOIN tests t ON tr.test_id = t.id
       WHERE tr.patient_ssn = $1 AND tr.patient_mobile = $2 AND tr.auth_token = $3
       AND tr.tested_on >= NOW() - INTERVAL '30 days'`,
      [patientSSN, patientMobile, authToken]
    );
    return result.rows;
  },

  getTestResultById: async (testId, patientSSN, patientMobile) => {
    const result = await db.query(
      `SELECT tr.id, t.name as test_name, tr.test_type as type, tr.result, 
       tr.tested_on as tested_on, tr.status, tr.result_url as url
       FROM test_results tr
       JOIN tests t ON tr.test_id = t.id
       WHERE tr.id = $1 AND tr.patient_ssn = $2 AND tr.patient_mobile = $3`,
      [testId, patientSSN, patientMobile]
    );
    return result.rows[0];
  },
};

module.exports = Test;
