const Student = require("../schemas/studentSchema");
const Exam = require("../schemas/examSchema");
const Course = require("../schemas/courseSchema");
const { School } = require("../schemas/schoolSchema");

const { StudentNew, SectionNew } = require("../schemas/courseSchema");

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

    let school;
    school = await School.findOne(
      { schoolCode, "students._id": _id },
      { "students.$": 1 }
    );

    const sectionId = school.students[0].course.section;

    const workingDates = await SectionNew.findOne({
      _id: sectionId,
      schoolCode,
    }).select("workingDates");

    const exam = await SectionNew.findOne({
      _id: sectionId,
      schoolCode,
    }).select("exam");

    const examId = exam.exam;

    const result = await Exam.findOne({ _id: examId, schoolCode })
      .where("term.publishedDate")
      .exists(true)
      .select("term")
      .exec();

    if (result) {
      req.exam = result.term.map((t) =>
        t.subjects.map((sub) => {
          return {
            _id: sub._id,
            subject: sub.subject,
            student: sub.students.find((std) => std.student.toString() === _id),

            fullMarks: sub.fullMarks,
            passMarks: sub.passMarks,

            fullMarks2: sub.fullMarks2,
            passMarks2: sub.passMarks2,
          };
        })
      );
    } else {
      req.exam = [];
    }

    const student = await StudentNew.findOne({ studentId: _id, schoolCode });

    req.data = {
      student,
      workingDays: workingDates.workingDates,
      exam: req.exam,
    };

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

// get student exam info
async function getStudentExamInfo(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;

    let school;
    school = await School.findOne(
      { schoolCode, "students._id": _id },
      { "students.$": 1 }
    );

    const sectionId = school.students[0].course.section;

    const exam = await SectionNew.findOne({
      _id: sectionId,
      schoolCode,
    }).select("exam");

    const examId = exam.exam;

    const result = await Exam.findOne({ _id: examId, schoolCode })
      .where("term.publishedDate")
      .exists(true)
      .select("term")
      .exec();

    req.exam = result.term.map((t) =>
      t.subjects.map((sub) => {
        return {
          _id: sub._id,
          subject: sub.subject,
          student: sub.students.find((std) => std.student.toString() === _id),

          fullMarks: sub.fullMarks,
          passMarks: sub.passMarks,

          fullMarks2: sub.fullMarks2,
          passMarks2: sub.passMarks2,
        };
      })
    );

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Get Student Failed",
      message: e.message,
    });
  }
}

module.exports = { studentUpdate, studentExams, getStudentInfoFromCourse };
