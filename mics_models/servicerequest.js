const db = require("../config/db");

const ServiceRequest = {
  create: async (doctorId, patientSSN, patientPhone, type) => {
    const result = await db.query(
      "INSERT INTO requests (doctor_id, patient_ssn, email_patient, type) VALUES ($1, $2, $3, $4) RETURNING *",
      [doctorId, patientSSN, patientPhone, type]
    );
    return result.rows[0];
  },

  getByDoctor: async (doctorId) => {
    const result = await db.query(
      "SELECT * FROM requests WHERE doctor_id = $1 ORDER BY created_at DESC",
      [doctorId]
    );
    return result.rows;
  },
  getAll: async () => {
    const result = await db.query(
      `SELECT 
       sr.patient_ssn,
       json_agg(
         json_build_object(
           'request_id', sr.id,
           'email_patient', sr.email_patient,
           'type', sr.type,
           'created_at', sr.created_at,
           'doctor', json_build_object(
             'id', u.id,
             'first_name', u.first_name,
             'last_name', u.last_name,
             'username', u.username,
             'ssn', u.ssn,
             'email', u.email,
             'phone', u.phone,
             'country_code', u.country_code,
             'role', u.role,
             'status', u.status,
             'created_at', u.created_at
           )
         )
       ) as doctor_requests,
       json_build_object(
         'name', lt.name,
         'email', lt.email,
         'mobile_no', lt.mobile_no,
         'ssn', lt.ssn
       ) as patient_details,
       json_build_object(
         'name', lt.name,
         'email', lt.email,
         'mobile_no', lt.mobile_no,
         'lab', json_build_object(
           'id', l.id,
           'name', l.name,
           'address', l.address,
           'email', l.email,
           'phone', l.phone,
           'status', l.status,
           'total_req', l.total_req,
           'success_rate', l.success_rate
         ),
         'status', lt.status,
         'result_type', lt.result_type,
         'type', lt.type,
         'url', lt.url,
         'created_at', lt.created_at
       ) as lab_test_details
     FROM public.requests sr
     JOIN public.users u ON sr.doctor_id = u.id
     LEFT JOIN public.lab_tests lt ON sr.patient_ssn = lt.ssn::VARCHAR
     LEFT JOIN public.labs l ON lt.lab = l.id
     GROUP BY sr.patient_ssn, lt.name, lt.email, lt.mobile_no, lt.ssn, lt.status, 
              lt.result_type, lt.type, lt.url, lt.created_at,
              l.id, l.name, l.address, l.email, l.phone, l.status, l.total_req, l.success_rate
     ORDER BY sr.patient_ssn`
    );
    return result.rows;
  },

  getByDoctorId: async (doctorId) => {
    try {
      const result = await db.query(
        `SELECT * FROM requests WHERE doctor_id = $1 ORDER BY created_at DESC`,
        [doctorId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  getGroupedByPatientWithDetails: async (doctorId) => {
    try {
      const result = await db.query(
        `SELECT 
        sr.patient_ssn,
        json_agg(
          json_build_object(
            'request_id', sr.id,
            'email_patient', sr.email_patient,
            'type', sr.type,
            'created_at', sr.created_at
          )
        ) as requests,
        json_build_object(
          'name', lt.name,
          'email', lt.email,
          'mobile_no', lt.mobile_no,
          'ssn', lt.ssn
        ) as patient_details,
        json_build_object(
          'name', l.name,
          'address', l.address,
          'email', l.email,
          'phone', l.phone
        ) as lab_details
      FROM requests sr
      LEFT JOIN lab_tests lt ON sr.patient_ssn = lt.ssn::VARCHAR
      LEFT JOIN labs l ON lt.lab = l.id
      WHERE sr.doctor_id = $1
      GROUP BY sr.patient_ssn, lt.name, lt.email, lt.mobile_no, lt.ssn, 
               l.name, l.address, l.email, l.phone
      ORDER BY sr.patient_ssn`,
        [doctorId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = ServiceRequest;
