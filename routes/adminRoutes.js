const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.use(authMiddleware);
router.use(roleMiddleware(["Admin"]));

// Doctor management
router.post("/users/addDoctor", AdminController.addDoctor);
router.get("/users/doctors", AdminController.listDoctors);
router.post("/users/update", AdminController.updateDoctor);
router.post("/users/delete", AdminController.deleteDoctor);

// Lab management
router.post("/lab/addLab", AdminController.addLab);
router.get("/labs", AdminController.listLabs);
router.post("/lab/edit", AdminController.updateLab);
router.post("/lab/delete", AdminController.deleteLab);

// Requests
router.get("/user/getDoctorRequests", AdminController.getDoctorRequests);

module.exports = router;
