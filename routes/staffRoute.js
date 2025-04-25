const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const {
  createGallery,
  deleteUpdate,
  editUpdate,
  createUpdate,
  staffUpdate,
  // studentsAttendance,
  getStudent,
  getAllStudents,
  getAllStaffs,
  getStaff,
  updateExamMarks,
} = require("../controllers/staffController");

//usage
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { verifySchoolStaff } = require("../middlewares/verifyToken");
const { rawListeners } = require("../schemas/examSchema");

//middlewares
router.use(express.json());
router.use(cookieParser());
router.use(bodyParser.urlencoded({ extended: true }));

// edit update
router.put(
  "/:schoolCode/update/:_id",
  verifySchoolStaff,
  upload.fields([{ name: "images", maxCount: 999 }]),
  editUpdate,
  (req, res) => {
    res.status(200).send({
      success: true,
      message: "Update edited successfully",
    });
  }
);

// Upload image to the gallery
router.post(
  "/:schoolCode/gallery/upload",
  verifySchoolStaff,
  upload.fields([{ name: "photo", maxCount: 999 }]),
  createGallery,
  (req, res) => {
    res.status(200).send({
      success: true,
      message: "Images has been uploaded",
    });
  }
);

//create new update
router.post(
  "/:schoolCode/updates/new",
  verifySchoolStaff,
  upload.fields([{ name: "images", maxCount: 999 }]),
  createUpdate,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Success",
      message: "Update has been created",
    });
  }
);

//delete update
router.delete(
  "/:schoolCode/update/:_id",
  verifySchoolStaff,
  deleteUpdate,
  (req, res) => {
    res.status(200).send({
      success: true,
      message: "Update deleted successfully",
    });
  }
);

//staff profile update
router.put(
  "/:schoolCode/profile/update",
  verifySchoolStaff,
  upload.fields([{ name: "pPhoto", maxCount: 1 }]),
  staffUpdate,
  (req, res) => {
    res.status(200).send({
      success: true,
      data: req.staff,
    });
  }
);

// Get all students
router.get(
  "/:schoolCode/students",
  verifySchoolStaff,
  getAllStudents,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Student Get Successful",
      data: req.student,
      courses: req.courses
    });
  }
);

// Get all staffs
router.get(
  "/:schoolCode/staffs",
  verifySchoolStaff,
  getAllStaffs,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Staffs Get Successful",
      data: req.staffs,
    });
  }
);

// Get a Particular student
router.get(
  "/:schoolCode/student/:_id",
  verifySchoolStaff,
  getStudent,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Student Get Successful",
      data: req.student,
    });
  }
);

// Get a Particular staff
router.get(
  "/:schoolCode/staff/:_id",
  verifySchoolStaff,
  getStaff,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Staff Get Successful",
      data: req.staff,
    });
  }
);

//Update exam marks by Staff
router.post(
  "/:schoolCode/exam/update",
  verifySchoolStaff,
  updateExamMarks,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Updation Successful",
      message: "Exam details updated successfully",
    });
  }
);

module.exports = router;
