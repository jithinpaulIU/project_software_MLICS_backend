const User = require("../mics_models/user");
const Lab = require("../mics_models/lab");
// const Doctor = require("../mics_models/doctor");
const LabRequest = require("../mics_models/labRequest");
const ServiceRequest = require("../mics_models/servicerequest");
const bcrypt = require("bcryptjs");

const AdminController = {
  addDoctor: async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        username,
        SSN,
        email,
        password,
        phone,
        countryCode,
      } = req.body;

      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res
          .status(400)
          .json({ status: false, message: "Username already exists" });
      }

      const doctor = await User.create({
        firstName,
        lastName,
        username,
        ssn: SSN,
        email,
        password,
        phone,
        countryCode,
        role: "Doctor",
      });

      res.status(201).json({
        status: true,
        message: "Doctor added successfully",
        data: doctor,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  listDoctors: async (req, res) => {
    try {
      const doctors = await User.getAllDoctors();
      res.json({ status: true, data: doctors });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  updateDoctor: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, phone, countryCode, email, ssn } = req.body;

      const updatedDoctor = await User.update(id, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username,
        phone,
        countryCode,
        email,
        ssn,
      });

      res.json({
        status: true,
        message: "Doctor updated successfully",
        data: updatedDoctor,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  deleteDoctor: async (req, res) => {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: "Doctor ID is required",
        });
      }

      // Fetch user by ID
      const doctor = await User.findById(id);

      if (!doctor) {
        return res.status(404).json({
          status: false,
          message: "Doctor not found or already deleted",
        });
      }

      // Proceed to soft delete
      const result = await User.softDelete(id);

      if (result.affected === 0) {
        return res.status(500).json({
          status: false,
          message: "Failed to delete doctor",
        });
      }

      res.json({ status: true, message: "Doctor deleted successfully" });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  addLab: async (req, res) => {
    try {
      const { Name: name, Address: address, email, password } = req.body;
      const lab = await Lab.create(
        { name, address, email, password },
        req.user.id
      );
      res
        .status(201)
        .json({ status: true, message: "Lab added successfully", data: lab });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  listLabs: async (req, res) => {
    try {
      const labs = await Lab.getAll();
      res.json({ status: true, data: labs });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  updateLab: async (req, res) => {
    try {
      const { id } = req.params;
      const { address, phoneNumber: contactNumber } = req.body;

      const updatedLab = await Lab.update(id, {
        name: req.body.Name,
        address,
        contactNumber,
      });

      res.json({
        status: true,
        message: "Lab updated successfully",
        data: {
          Name: updatedLab.name,
          Address: updatedLab.address,
          username: updatedLab.email,
          email: updatedLab.email,
          status: updatedLab.status,
          createdAt: updatedLab.created_at,
          updatedAt: updatedLab.updated_at,
        },
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  deleteLab: async (req, res) => {
    try {
      const { id } = req.body;
      await Lab.softDelete(id);
      res.json({ status: true, message: "Lab deleted successfully" });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  getAuthRequests: async (req, res) => {
    try {
      const requests = await User.getAuthRequests();
      res.json({ status: true, data: requests });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  getLabRequests: async (req, res) => {
    try {
      const requests = await LabRequest.getLabRequests();
      res.json({ status: true, data: requests });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  getDoctorRequests: async (req, res) => {
    try {
      const requests = await ServiceRequest.getAll();
      console.log(JSON.stringify(requests, null, 2));

      const formattedData = requests.map((request) => {
        return {
          SSN: request.patient_ssn,
          patient_details: request.patient_details || {},
          lab_test_details: request.lab_test_details || {},
          requests: request.doctor_requests.map((dr) => ({
            request_id: dr.request_id,
            email: dr.email_patient,
            type: dr.type,
            timestamp: dr.created_at,
            doctor: {
              id: dr.doctor.id,
              first_name: dr.doctor.first_name,
              last_name: dr.doctor.last_name,
              username: dr.doctor.username,
              ssn: dr.doctor.ssn,
              email: dr.doctor.email,
              phone: dr.doctor.phone,
              country_code: dr.doctor.country_code,
              role: dr.doctor.role,
              status: dr.doctor.status,
            },
          })),
        };
      });

      res.json({
        status: true,
        data: formattedData,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
};

module.exports = AdminController;
