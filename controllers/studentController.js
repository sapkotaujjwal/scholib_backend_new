// const express = require("express");
// const app = express();

const Student = require("../schemas/studentSchema");
const Exam = require("../schemas/examSchema");
const Course = require("../schemas/courseSchema");
const School = require("../schemas/schoolSchema");

// short hand to get the student
const findStudent = (course, classId, groupId, sectionId, _id) => {
  const courseObj = course.course.find(
    (first) => first._id.toString() === classId
  );
  if (!courseObj) return null;

  const groupObj = courseObj.groups.find(
    (second) => second._id.toString() === groupId
  );
  if (!groupObj) return null;

  const sectionObj = groupObj.sections.find(
    (third) => third._id.toString() === sectionId
  );

  let workingDays = sectionObj.workingDates.length;

  if (!sectionObj) return null;

  return ({
    data: sectionObj.students.find((last) => last._id.toString() === _id),
    workingDays
  })
  
};

//update student
async function studentUpdate(req, res, next) {
  try {
    const student = req.student;
    const data = req.body;

    if (req.files && req.files["photo1"]) {
      for (const file of req.files["pPhoto"]) {
        const photo = await photoWork(file);
        const image = {
          blurHash: photo.blurHash,
          secure_url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        data.photo1 = image;
      }
    }

    if (req.files && req.files["photo2"]) {
      for (const file of req.files["pPhoto"]) {
        const photo = await photoWork(file);
        const image = {
          blurHash: photo.blurHash,
          secure_url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        data.photo2 = image;
      }
    }

    if (req.files && req.files["photo3"]) {
      for (const file of req.files["pPhoto"]) {
        const photo = await photoWork(file);
        const image = {
          blurHash: photo.blurHash,
          secure_url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        data.photo3 = image;
      }
    }

    if (req.files && req.files["photo4"]) {
      for (const file of req.files["pPhoto"]) {
        const photo = await photoWork(file);
        const image = {
          blurHash: photo.blurHash,
          secure_url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        data.photo4 = image;
      }
    }

    delete data.course;
    delete data.status;
    delete data.loginId;
    delete data.schoolCode;
    delete data.password;
    delete data.amount;
    delete data.scholarship;
    delete data.paymentHistory;
    delete data.bus;
    delete data.result;
    delete data.absentDays;
    delete data.library;
    delete data.scholib;
    delete data.tokens;

    student.set(data);

    req.student = await student.save();

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Student Profile updation failed`,
      message: e.message,
    });
  }
}

// student exam
async function studentExams(req, res, next) {
  try {
    const { schoolCode } = req.params;
    const user = req.cookies.user;
    const token = req.cookies.jwtCookie;

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Password updation failed`,
      message: e.message,
    });
  }
}

// get the actual student from the course schema
async function getStudentInfoFromCourse(req, res, next) {
  try {
    const { schoolCode } = req.params;
    const _id = req.student._id.toString();

    const school = await School.findOne({ schoolCode });
    const course = await Course.findOne({ schoolCode }).select("course");

    const studentFromSchool = school.students.find(
      (std) => std._id.toString() === _id
    ).course;

    const groupId = studentFromSchool.group;
    const sectionId = studentFromSchool.section;
    const classId = studentFromSchool.class;

    const otherData = findStudent(course, classId, groupId, sectionId, _id);

    const student = otherData.data;

    if (!student) {
      return res.status(404).send({
        success: false,
        status: "Student not found",
        message: "The student you are looking for does not exists",
      });
    }

    const workingDays = otherData.workingDays;

    req.data = {student,workingDays};

    next();
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      success: false,
      status: "Get Student Failed",
      message: e.message,
    });
  }
}

module.exports = { studentUpdate, studentExams, getStudentInfoFromCourse };
