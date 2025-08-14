const express = require("express");
const router = express.Router();
const Joi = require("joi");
const validateRequest = require("_middleware/validate-request");
const authorize = require("_middleware/authorize");
const userService = require("./user.service");
const superadminService = require("../superadmin/superadmin.service");
const sendEmail = require("_helpers/sendEmail");
const otpGenerator = require("otp-generator");
const axios = require("axios");
const jwt_decode = require("jwt-decode");

const { getTestListUrl, getTestResultUrl } = require("config.json");

// routes
router.post("/login", login);
router.put("/doctor/:id", authorize(), updateDoctorSchema, updateDoctor);
router.post("/sendotp", authorize(), sendOtpSchema, sendotp);
router.post(
  "/validatePatient",
  authorize(),
  validatePatientSchema,
  validatePatient
);
router.post("/testList", authorize(), testlistSchema, testList);
router.post("/testResult", authorize(), testResultSchema, testResult);
router.get("/request", authorize(), getAllRequestforDoctor);

module.exports = router;

async function login(req, res, next) {
  try {
    const user = await userService.authenticate(req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
}

function updateDoctorSchema(req, res, next) {
  const schema = Joi.object({
    firstName: Joi.string().empty(""),
    lastName: Joi.string().empty(""),
    email: Joi.string().empty(""),
    SSN: Joi.number().empty(""),
    password: Joi.string().min(6).empty(""),
    mobileNo: Joi.string().empty(""),
  });
  validateRequest(req, next, schema);
}

function sendOtpSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
    SSN: Joi.number().required(),
    mobileNo: Joi.string().empty(""),
  });
  validateRequest(req, next, schema);
}

function validatePatientSchema(req, res, next) {
  console.log();
  const schema = Joi.object({
    SSN: Joi.number().required(),
    otp: Joi.string().empty(""),
  });
  validatePatient(req, next, schema);
}

function testlistSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
    labid: Joi.number().required(),
  });
  validateRequest(req, next, schema);
}

function testResultSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
    testid: Joi.number().required(),
    labid: Joi.number().required(),
  });
  validateRequest(req, next, schema);
}

async function testResult(req, res, next) {
  try {
    const { token, testid } = req.body;
    const decoded = jwt_decode(token);
    const [SSN, , email] = decoded.sub.split("#");

    const status = await userService.AddRequestforResult(
      { ...req.body, SSN, email },
      req.user
    );

    if (!status) {
      return res
        .status(200)
        .json({ message: "The request get list is already pending" });
    }

    const config = {
      method: "get",
      url: `${getTestResultUrl}${testid}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    let finalResponse = {};
    let update = { status: "failed", endtime: new Date().toISOString() };

    try {
      const response = await axios(config);
      if (response.status === 200) {
        update.status = "completed";
        finalResponse = response.data;
      }
    } catch (error) {
      console.error("API Error:", error);
    }

    const updatedStatus = await userService.updateRequestResponse(
      update,
      status.id
    );

    if (!updatedStatus) {
      return res
        .status(401)
        .json({ message: "Error in fetching the TestResults" });
    }

    if (Object.keys(finalResponse).length > 0) {
      res.json(finalResponse);
    } else {
      res.status(404).json({ message: "No data found" });
    }
  } catch (error) {
    next(error);
  }
}

async function testList(req, res, next) {
  try {
    const { token, labid } = req.body;
    const decoded = jwt_decode(token);
    const [SSN, , email] = decoded.sub.split("#");

    const status = await userService.AddRequestforlist(
      { ...req.body, SSN, email },
      req.user
    );

    if (!status) {
      return res
        .status(200)
        .json({ message: "The request get list is already pending" });
    }

    const config = {
      method: "get",
      url: `${getTestListUrl}${SSN}/${labid}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    let finalResponse = [];
    let update = { status: "failed", endtime: new Date().toISOString() };

    try {
      const response = await axios(config);
      if (response.status === 200) {
        update.status = "completed";
        finalResponse = response.data;
      }
    } catch (error) {
      console.error("API Error:", error);
    }

    const updatedStatus = await userService.updateRequestResponse(
      update,
      status.id
    );

    if (!updatedStatus) {
      return res
        .status(401)
        .json({ message: "Error in fetching the TestList" });
    }

    if (finalResponse.length > 0) {
      res.json(finalResponse);
    } else {
      res.status(404).json({ message: "No data found" });
    }
  } catch (error) {
    next(error);
  }
}

async function sendotp(req, res, next) {
  try {
    const otp = otpGenerator.generate(6, {
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });

    await sendEmail.sendotp(req.body.email, otp);

    const status = await userService.AddRequest({ ...req.body, otp }, req.user);

    if (status) {
      res.status(200).json({ message: "OTP sent to patient email address" });
    } else {
      res.status(200).json({ message: "The request is already pending" });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error in sending email" });
  }
}

async function validatePatient(req, res, next) {
  try {
    const { SSN, otp } = req.body;

    const request = await userService.getRequestBySSNAndOTP(SSN, otp);

    if (!request) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = new Date();
    const otpTimestamp = new Date(request.starttime);

    if (now - otpTimestamp > 30000) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const token = await userService.authenticatepatient(request);

    if (token) {
      res.status(200).json({
        token,
        SSN: request.SSN,
        message: "Patient authentication Success",
      });
    } else {
      res.status(401).json({ message: "Patient authentication Failure" });
    }
  } catch (error) {
    next(error);
  }
}

async function updateDoctor(req, res, next) {
  try {
    const user = await superadminService.update(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
}

async function getAllRequestforDoctor(req, res, next) {
  try {
    const doctorRequest = await userService.getAllRequestforDoctor(req.user.id);
    res.json(doctorRequest);
  } catch (error) {
    next(error);
  }
}
