const User = require("../mics_models/user");
const Lab = require("../mics_models/lab");
const Doctor = require("../mics_models/doctor");
const LabRequest = require("../mics_models/labRequest");
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
      const { username, mobileNumber: phone } = req.body;

      const updatedDoctor = await User.update(id, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username,
        phone,
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
      await User.softDelete(id);
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
      const requests = await Doctor.getAuthRequests();
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

      // Group by SSN
      const groupedRequests = requests.reduce((acc, request) => {
        if (!acc[request.patient_ssn]) {
          acc[request.patient_ssn] = {
            SSN: request.patient_ssn,
            Request: [],
          };
        }

        acc[request.patient_ssn].Request.push({
          SSN: request.patient_ssn,
          phone: request.patient_phone,
          type: request.type,
          timestamp: request.created_at,
        });

        return acc;
      }, {});

      res.json({
        status: true,
        data: Object.values(groupedRequests),
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
};

module.exports = AdminController;
