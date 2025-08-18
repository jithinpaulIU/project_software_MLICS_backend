const db = require("../config/db");

const Test = {
  getTestsByLab: async (labId) => {
    const result = await db.query("SELECT * FROM tests WHERE lab_id = $1", [
      labId,
    ]);
    return result.rows;
  },

  getTestResults: async (patientSSN, patientEmail, labId) => {
    // First get test results
    const testQuery = `
      SELECT 
        t.id, 
        t.type, 
        t.created_at, 
        t.status, 
        t.result_type as result,
        t.lab,
        t.url
      FROM 
        lab_tests t
      WHERE 
        t.ssn = $1 
        AND t.email = $2 
        AND t.lab = $3
      ORDER BY 
        t.created_at DESC
    `;
    const testValues = [patientSSN, patientEmail, labId];
    const { rows: testResults } = await db.query(testQuery, testValues);

    // Then get lab details
    const labQuery = `
      SELECT 
        id,
        name,
        address,
        email,
        phone,
        status,
        total_req,
        success_rate
      FROM 
        labs
      WHERE 
        id = $1
    `;
    const { rows: labDetails } = await db.query(labQuery, [labId]);

    return {
      testResults,
      labDetails: labDetails[0] || null,
    };
  },

  getTestResultById: async (testId, patientSSN, patientMobile) => {
    const result = await db.query(
      `SELECT 
        id,
        type,
        created_at,
        status,
        result_type as result,
        url
      FROM 
        lab_tests
      WHERE 
        id = $1 AND ssn = $2 AND mobile_no = $3`,
      [testId, patientSSN, patientMobile]
    );
    return result.rows[0];
  },
};

module.exports = Test;
