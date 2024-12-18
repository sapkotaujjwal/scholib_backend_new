const express = require("express");
const router = express.Router();
const upload = require("../config/multer");

//usage
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { verifySchoolStaff } = require("../middlewares/verifyToken");
const {
  getStudentFromCourse,
  startBusService,
  endBusService,
  studentProfileUpdate,
  deleteAdmission,
  updateAndAcceptAdmission,
  acceptAdmission,
  suspendStudent,
  deleteStudent,
  addFine,
  addDiscount,
  payFees,
  addBook,
  returnBooks,
  changeCourse,
  getAllStudentsFromCourse,
  takeAttendance,
  getStudentExamInfo,
  updateParticularStudentMarks
} = require("../controllers/studentsControlsMain");

//middlewares
router.use(express.json());
router.use(cookieParser());
router.use(bodyParser.urlencoded({ extended: true }));

//middleware
async function checkAdmin(req, res, next) {
  const staff = req.staff;

  if (
    staff.role === "Administrator" ||
    staff.role === "Coordinator" ||
    staff.role === "Moderator"
  ) {
    return next();
  } else {
    return res.status(403).send({
      success: false,
      status: "Not authorized",
      message:
        "Only Administrator, Coordinator, or Moderator are allowed for this operation",
    });
  }
}

// **********************************************************************************************

// reject student admission inquiry
router.delete(
  "/:schoolCode/admission/:_id",
  verifySchoolStaff,
  checkAdmin,
  deleteAdmission,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Student Deleted",
      message: "Admission inquiry rejected successfully",
    });
  }
);

// accept student admission inquiry
router.get(
  "/:schoolCode/admission/:_id",
  verifySchoolStaff,
  checkAdmin,
  acceptAdmission,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Student Admitted",
      message: "Admission inquiry accepted successfully",
    });
  }
);

// Update and Accept student admission inquiry
router.put(
  "/:schoolCode/admission/:_id",
  upload.fields([
    { name: "photo1", maxCount: 1 },
    { name: "photo2", maxCount: 1 },
    { name: "photo3", maxCount: 1 },
    { name: "photo4", maxCount: 1 },
  ]),
  verifySchoolStaff,
  checkAdmin,
  updateAndAcceptAdmission,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Student updated and admitted successfully",
    });
  }
);

// Suspend student from school
router.delete(
  "/:schoolCode/student/suspend/:_id",
  verifySchoolStaff,
  checkAdmin,
  suspendStudent,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Student Suspended",
      message: "Student has been suspended successfully",
    });
  }
);

// Student profile update
router.put(
  "/:schoolCode/students/profile/update/:_id",
  verifySchoolStaff,
  checkAdmin,
  upload.fields([
    { name: "photo1", maxCount: 1 },
    { name: "photo2", maxCount: 1 },
    { name: "photo3", maxCount: 1 },
    { name: "photo4", maxCount: 1 },
  ]),
  studentProfileUpdate,
  (req, res) => {
    res.status(200).send({
      success: true,
      data: req.student,
    });
  }
);

// Start Bus Service for the student
router.get(
  "/:schoolCode/student/:_id/startBus",
  verifySchoolStaff,
  checkAdmin,
  startBusService,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Bus Service Started",
    });
  }
);

// End Bus Service for the student
router.get(
  "/:schoolCode/student/:_id/endBus",
  verifySchoolStaff,
  checkAdmin,
  endBusService,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Bus Service Ended",
    });
  }
);

// Get student from the course schema
router.get(
  "/:schoolCode/student/:_id",
  verifySchoolStaff,
  checkAdmin,
  getStudentFromCourse,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Student Found Successfully",
      data: req.student,
    });
  }
);

// Get All Students from the course schema
router.get(
  "/:schoolCode/advanced/students",
  verifySchoolStaff,
  checkAdmin,
  getAllStudentsFromCourse,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Students Found Successfully",
      data: req.students,
    });
  }
);

// Take Students Attendance
router.get(
  "/:schoolCode/advanced/admission/take",
  verifySchoolStaff,
  checkAdmin,
  takeAttendance,
  (req, res) => {
    return res.status(200).send({
      success: true,
      status: "Attendance taken successfully",
    });
  }
);

// Add a fine to student
router.get(
  "/:schoolCode/student/:_id/addFine",
  verifySchoolStaff,
  checkAdmin,
  addFine,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Fine Added Successfully",
    });
  }
);

// Add a discount to student
router.get(
  "/:schoolCode/student/:_id/addDiscount",
  verifySchoolStaff,
  checkAdmin,
  addDiscount,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Discount Added Successfully",
    });
  }
);

// Pay student Fees
router.get(
  "/:schoolCode/student/:_id/payFees",
  verifySchoolStaff,
  checkAdmin,
  payFees,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Request Successful",
      message: "Amount has been paid successfully",
    });
  }
);

// Add book
router.get(
  "/:schoolCode/student/:_id/addBook",
  verifySchoolStaff,
  checkAdmin,
  addBook,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Request Successful",
      message: "Book added successfully",
    });
  }
);

// Return Book
router.get(
  "/:schoolCode/student/:_id/returnBooks",
  verifySchoolStaff,
  checkAdmin,
  returnBooks,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Request Successful",
      message: "Book returned successfully",
    });
  }
);

// change student course
router.post(
  "/:schoolCode/student/:_id/changeCourse",
  verifySchoolStaff,
  checkAdmin,
  changeCourse,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Course Updated",
      message: "Course Updated successfully",
    });
  }
);

// Delete the student from the section and remove from school.students and add in         olderData.students with year adjustment
router.delete(
  "/:schoolCode/student/:_id/delete",
  verifySchoolStaff,
  checkAdmin,
  deleteStudent,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Student Deleted",
      message: "Student has been deleted successfully",
    });
  }
);

// Get the student exam info
router.get(
  "/:schoolCode/student/:_id/exam",
  verifySchoolStaff,
  checkAdmin,
  getStudentExamInfo,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Exam Info Found",
      data: req.exam
    });
  }
);


// Update particular student exam marks
router.post(
  "/:schoolCode/student/:_id/updateMarks",
  verifySchoolStaff,
  checkAdmin,
  updateParticularStudentMarks,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Marks Updated",
      message: "Exam info updated successfully",
    });
  }
);

module.exports = router;
