const Lab = require("../mics_models/lab");
const OTP = require("../mics_models/otp");
const Test = require("../mics_models/test");
const LabRequest = require("../mics_models/labRequest");
const ServiceRequest = require("../mics_models/servicerequest");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const DoctorController = {
  getLabs: async (req, res) => {
    try {
      const labs = await Lab.getAll();
      res.json({ status: true, data: labs });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  requestOTP: async (req, res) => {
    try {
      const { SSN, email } = req.body;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // In a real app, send OTP to email
      console.log(`OTP for ${email}: ${otp}`);

      // Store OTP in database
      await OTP.create(req.user.id, SSN, email, otp, expiresAt);

      // Record service request
      await ServiceRequest.create(req.user.id, SSN, email, "otpRequest");

      res.json({ status: true, message: "OTP sent successfully" });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  submitOTP: async (req, res) => {
    try {
      const { SSN, otp } = req.body;
      const patientMobile = req.body.MobileNo || req.body.mobileNo;

      const otpRecord = await OTP.findByDetails(
        req.user.id,
        SSN,
        patientMobile,
        otp
      );
      if (!otpRecord) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid OTP or OTP expired" });
      }

      await OTP.markAsUsed(otpRecord.id);

      // Record service request
      await ServiceRequest.create(
        req.user.id,
        SSN,
        patientMobile,
        "authenticationRequest"
      );

      // Generate auth token
      const authToken = jwt.sign(
        { doctorId: req.user.id, patientSSN: SSN, patientMobile },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        status: true,
        message: "OTP verified successfully",
        data: {
          SSN,
          BearerToken: authToken,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  requestLabTests: async (req, res) => {
    try {
      const { labId, patientSSN, patientMobile, authToken } = req.body;

      await LabRequest.create(
        labId,
        req.user.id,
        patientSSN,
        patientMobile,
        authToken
      );
      await Lab.incrementRequests(labId);

      res.json({ status: true, message: "Lab test requested successfully" });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  getTestResults: async (req, res) => {
    try {
      const { SSN, MobileNo, BearerToken } = req.query;
      const patientMobile = MobileNo || req.query.mobileNo;

      const results = await Test.getTestResults(
        SSN,
        patientMobile,
        BearerToken
      );

      res.json({
        status: true,
        SSN,
        testList: results.map((r) => ({
          testID: r.id,
          type: r.type,
          tested_on: r.tested_on,
          Status: r.status,
        })),
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  getTestResult: async (req, res) => {
    try {
      const { SSN, mobileNo, testID } = req.body;

      const result = await Test.getTestResultById(testID, SSN, mobileNo);
      if (!result) {
        return res
          .status(404)
          .json({ status: false, message: "Test result not found" });
      }

      res.json({
        status: true,
        SSN,
        testID: result.id,
        tested_on: result.tested_on,
        Status: result.status,
        url: result.url,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },

  requestAuthentication: async (req, res) => {
    try {
      await Doctor.requestAuthentication(req.user.id);
      res.json({
        status: true,
        message: "Authentication request submitted successfully",
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  },
};

module.exports = DoctorController;
