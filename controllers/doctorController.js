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
      console.log(
        `OTP for is ${email}: ${otp}, ${req.body}, ${SSN}, ${email}, ${otp}, ${expiresAt}`
      );

      // Store OTP in database
      await OTP.create(req.user.id, SSN, email, otp, expiresAt);

      // Record service request
      await ServiceRequest.create(req.user.id, SSN, email, "otpRequest");

      res.json({ status: true, message: "OTP sent successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ status: false, message: error.message });
    }
  },

  submitOTP: async (req, res) => {
    try {
      const { SSN, otp, email } = req.body;
      // const patientMobile = req.body.email || req.body.mobileNo;
      console.log(req.body, req.user.id);

      const otpRecord = await OTP.findByDetails(
        req.user.id,
        SSN,
        email,
        // patientMobile,
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
        email,
        "authenticationRequest"
      );

      // Generate auth token
      const authToken = jwt.sign(
        { doctorId: req.user.id, patientSSN: SSN, email },
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
      // Extract token and labid from request body
      const { token, labid } = req.body;

      // Verify and decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);

      // Extract patient details from decoded token
      const { patientSSN, email, doctorId } = decoded;

      // Convert to correct types
      const ssn = parseInt(patientSSN);
      const labId = parseInt(labid);

      if (isNaN(ssn)) {
        return res.status(400).json({
          status: false,
          message: "Invalid SSN format",
        });
      }

      if (isNaN(labId)) {
        return res.status(400).json({
          status: false,
          message: "Invalid lab ID format",
        });
      }

      // Get test results and lab details from database
      const { testResults, labDetails } = await Test.getTestResults(
        ssn,
        email,
        labId
      );

      if (!testResults || testResults.length === 0) {
        return res.status(404).json({
          status: false,
          message:
            "No test results found for this patient at the specified lab",
        });
      }

      if (!labDetails) {
        return res.status(404).json({
          status: false,
          message: "Lab details not found",
        });
      }

      res.json({
        status: true,
        doctorId,
        labDetails: {
          id: labDetails.id,
          name: labDetails.name,
          address: labDetails.address,
          email: labDetails.email,
          phone: labDetails.phone,
          status: labDetails.status,
          totalRequests: labDetails.total_req,
          successRate: labDetails.success_rate,
        },
        patientSSN: ssn,
        patientEmail: email,
        testList: testResults.map((r) => ({
          testID: r.id,
          type: r.type,
          tested_on: r.created_at,
          status: r.status,
          result: r.result,
          url: r.url,
          labId: r.lab,
        })),
      });
    } catch (error) {
      console.error("Error in getTestResults:", error);

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          status: false,
          message: "Invalid token",
        });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          status: false,
          message: "Token expired",
        });
      }
      res.status(500).json({
        status: false,
        message: error.message || "Failed to retrieve test results",
      });
    }
  },

  getTestResult: async (req, res) => {
    try {
      const { SSN, mobileNo, testID } = req.body;

      const result = await Test.getTestResultById(testID, SSN, mobileNo);
      if (!result) {
        return res.status(404).json({
          status: false,
          message: "Test result not found",
        });
      }

      res.json({
        status: true,
        testDetails: {
          testID: result.id,
          type: result.type,
          created_at: result.created_at,
          status: result.status,
          result: result.result,
          url: result.url,
        },
        patientSSN: SSN,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message,
      });
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
        created_at: result.created_at,
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
