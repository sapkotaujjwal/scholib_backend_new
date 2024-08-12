const express = require("express");
const router = express.Router();
const upload = require("../config/multer");

//usage
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { verifySchoolStudent } = require("../middlewares/verifyToken");
const {
  studentUpdate,
  studentExams,
  getStudentInfoFromCourse,
} = require("../controllers/studentController");

//middlewares
router.use(express.json());
router.use(cookieParser());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(verifySchoolStudent);

//student Exams
router.get("/:schoolCode/exams", studentExams, (req, res) => {
  res.status(200).send({
    success: true,
    message: "Logout Successful!",
  });
});

// Get student from the course schema
router.get(
  "/:schoolCode/info",
  getStudentInfoFromCourse,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Student info found",
      data: req.data,
    });
  }
);

//students profile update
router.put(
  "/:schoolCode/update",
  upload.fields([
    { name: "photo1", maxCount: 1 },
    { name: "photo2", maxCount: 1 },
    { name: "photo3", maxCount: 1 },
    { name: "photo4", maxCount: 1 },
  ]),
  studentUpdate,
  (req, res) => {
    res.status(200).send({
      success: true,
      data: req.student,
    });
  }
);

module.exports = router;
