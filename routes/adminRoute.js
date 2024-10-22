const express = require("express");
const router = express.Router();
const {
  createCourse2,
  updateCourse,
  updateSchool,
  deleteGallery,
  staffProfileUpdate,
  createNewStaff,
  findSchoolAdmissions,
  suspendStaff,
  delteBusRoute,
  addBusRoute,
  deleteReview,
  deleteFaq,
  addNewFaq,
  editFaq,
  addNewOthersTab,
  deleteOthersTab,
  updateOthersTab,
  findSchoolCoursesAdmin,
  addStaff,
  addExam,
  publishResult,
  getExamInfo,
  updateCourseNext,
  startNewSession,
  getAccountsInfo,
  updateSubjectTeachers,
  updateFeesInfo,
} = require("../controllers/adminController");
const upload = require("../config/multer");

//usage
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { verifySchoolStaff } = require("../middlewares/verifyToken");

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

//create courses
router.post(
  "/:schoolCode/courses/create",
  verifySchoolStaff,
  checkAdmin,
  createCourse2,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Course Creation Successful",
      message: "Course is created Successfully",
      data: req.course,
    });
  }
);

//update courses
router.put(
  "/:schoolCode/courses/update/:_id",
  verifySchoolStaff,
  checkAdmin,
  updateCourse,
  (req, res) => {
    res.status(200).send({
      success: true,
      course: req.course,
    });
  }
);

//delete image from gallery
router.delete(
  "/:schoolCode/gallery/:_id",
  verifySchoolStaff,
  checkAdmin,
  deleteGallery,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Image Deleted",
      message: "Image deleted successfully",
    });
  }
);

// particular staff profile update
router.put(
  "/:schoolCode/staff/profile/update/:_id",
  verifySchoolStaff,
  checkAdmin,
  upload.fields([{ name: "pPhoto", maxCount: 1 }]),
  staffProfileUpdate,
  (req, res) => {
    res.status(200).send({
      success: true,
      data: req.staff,
    });
  }
);

// create a new staff
router.post(
  "/:schoolCode/staff/new",
  verifySchoolStaff,
  checkAdmin,
  upload.fields([{ name: "pPhoto", maxCount: 1 }]),
  createNewStaff,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Staff Created Successfully",
      message: "Login credentials will be sent to the provided email",
      data: req.data,
    });
  }
);

// Find school's admissions
router.get(
  "/:schoolCode/admissions",
  verifySchoolStaff,
  checkAdmin,
  findSchoolAdmissions,
  (req, res) => {
    res.status(200).send({
      success: true,
      data: req.data,
    });
  }
);

// Find school courses
router.get(
  "/:schoolCode/courseInfo",
  verifySchoolStaff,
  checkAdmin,
  findSchoolCoursesAdmin,
  (req, res) => {
    res.status(200).send({
      success: true,
      data: req.data,
    });
  }
);

// delete a bus route
router.delete(
  "/:schoolCode/busRoute/:_id",
  verifySchoolStaff,
  checkAdmin,
  delteBusRoute,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Bus Route Deleted",
      message: "Bus Route has been deleted successfully",
    });
  }
);

// Add a bus route
router.post(
  "/:schoolCode/busRoute/new",
  verifySchoolStaff,
  checkAdmin,
  addBusRoute,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Bus Route Added",
      message: "Bus Route has been Added successfully",
    });
  }
);

// Suspend staff from school
router.delete(
  "/:schoolCode/staff/:_id",
  verifySchoolStaff,
  checkAdmin,
  suspendStaff,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Staff Suspended",
      message: "Staff has been suspended successfully",
    });
  }
);

// Add suspended staff back again
router.get(
  "/:schoolCode/staff/:_id/addAgain",
  verifySchoolStaff,
  checkAdmin,
  addStaff,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Staff Status Updated",
      message: "Staff is active now",
    });
  }
);

// delete a review
router.delete(
  "/:schoolCode/review/:_id",
  verifySchoolStaff,
  checkAdmin,
  deleteReview,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Review Deleted",
      message: "Review has been deleted successfully",
    });
  }
);

// delete FAQ
router.delete(
  "/:schoolCode/faq/:_id",
  verifySchoolStaff,
  checkAdmin,
  deleteFaq,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "FAQ Deleted",
      message: "Faq has been deleted successfully",
    });
  }
);

// Add a new FAQ
router.post(
  "/:schoolCode/faq/new",
  verifySchoolStaff,
  checkAdmin,
  addNewFaq,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Faq Added",
      message: "FAQ has been Added successfully",
      // data: req.faq,
    });
  }
);

// Edit FAQ
router.put(
  "/:schoolCode/faq/:_id",
  verifySchoolStaff,
  checkAdmin,
  editFaq,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Faq Updated",
      message: "FAQ has been updated successfully",
      data: req.faq,
    });
  }
);

//add a new others tag
router.post(
  "/:schoolCode/others/new",
  upload.fields([{ name: "images", maxCount: 5 }]),
  verifySchoolStaff,
  checkAdmin,
  addNewOthersTab,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Tab Added",
      message: "Tab has been Added successfully",
      data: req.data,
    });
  }
);

// update others Tab
router.put(
  "/:schoolCode/others/:_id",
  verifySchoolStaff,
  checkAdmin,
  updateOthersTab,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Tab Updated",
      message: "Tab has been updated successfully",
      data: req.data,
    });
  }
);

// delete others Tab
router.delete(
  "/:schoolCode/others/:_id",
  verifySchoolStaff,
  checkAdmin,
  deleteOthersTab,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Tab Deleted",
      message: "Tab has been deleted successfully",
    });
  }
);

// update the school info
router.put(
  "/:schoolCode/updateSchool",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "images", maxCount: 4 },
    { name: "principlePhoto", maxCount: 1 },
  ]),
  verifySchoolStaff,
  checkAdmin,
  updateSchool,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "School Updated Successfully",
      data: req.school,
    });
  }
);

// Start New Exam
router.get(
  "/:schoolCode/exam/add",
  verifySchoolStaff,
  checkAdmin,
  addExam,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Exam Added",
      message: "Now marks can be added for the result",
    });
  }
);

// Publish Result
router.get(
  "/:schoolCode/result/publish",
  verifySchoolStaff,
  checkAdmin,
  publishResult,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Result Published",
      message: "Now students can see their result",
    });
  }
);

// Get Exam Info
router.get(
  "/:schoolCode/exam/info",
  verifySchoolStaff,
  checkAdmin,
  getExamInfo,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Successful",
      data: req.data,
    });
  }
);

//Update courses next
router.post(
  "/:schoolCode/courses/setNext",
  verifySchoolStaff,
  checkAdmin,
  updateCourseNext,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Courses Updated Successful",
      message: "Courses has been updated Successfully",
    });
  }
);

// Start New Session
router.get(
  "/:schoolCode/sessions/new",
  verifySchoolStaff,
  checkAdmin,
  startNewSession,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Session Started",
      message: "New session has been started and all the students are promoted",
    });
  }
);

// Get Accounts Info for daily activities
router.get(
  "/:schoolCode/accounts/info",
  verifySchoolStaff,
  checkAdmin,
  getAccountsInfo,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Successful",
      data: req.data,
    });
  }
);

//Update Subject Teachers of a section
router.post(
  "/:schoolCode/section/updateSubjectTeachers",
  verifySchoolStaff,
  checkAdmin,
  updateSubjectTeachers,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Subject Teachers Updated",
      message: "Subject teachers updated Successfully",
    });
  }
);

//Update Fees Info
router.post(
  "/:schoolCode/course/feeUpdate",
  verifySchoolStaff,
  checkAdmin,
  updateFeesInfo,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Fees Updated",
      message: "Fees has been updated successfully",
    });
  }
);

module.exports = router;
