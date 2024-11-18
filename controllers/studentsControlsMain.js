const Course = require("../schemas/courseSchema");
const { School, OlderData } = require("../schemas/schoolSchema");
const Student = require("../schemas/studentSchema");
const { photoWork } = require("../config/photoWork");
const {
  getDate,
  getCurrentNepaliDate,
  isSameDay,
} = require("../config/nepaliDate");

const {
  CourseNew,
  SectionNew,
  GroupNew,
  StudentNew,
} = require("../schemas/courseSchema");

const { sendMail } = require("../config/sendEmail");
const Exam = require("../schemas/examSchema");
const Account = require("../schemas/accountSchema");

//delete school admission
const deleteAdmission = async (req, res, next) => {
  try {
    const { schoolCode, _id } = req.params;

    await Promise.all([
      School.updateOne(
        { schoolCode: schoolCode },
        { $pull: { admissions: { _id } } }
      ),
      Student.findByIdAndDelete({ schoolCode, _id }),
    ]);

    next();
  } catch (e) {
    res.status(500).send({
      success: false,
      status: "Something went wrong",
      message: e.message,
    });
  }
};

// get the actual student from the course schema
async function getStudentFromCourse(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;
    const student = await StudentNew.findOne({ studentId: _id, schoolCode });

    if (!student) {
      return res.status(404).send({
        success: false,
        status: "Student not found",
        message: "The student you are looking for does not exists",
      });
    }

    req.student = student;
    next();
  } catch (e) {
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

    // This one is for the school admin so we are not checking whether the result is published or not
    const result = await Exam.findOne({ _id: examId, schoolCode })
      // .where("term.publishedDate")
      // .exists(true)
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

// Add a fine to student
async function addFine(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;
    const classId = req.query.classId;
    const fineAmount = req.query.fineAmount;
    const remark = req.query.remark;

    if (fineAmount < 0) {
      throw new Error("Fine cannot be less than 0");
    }

    if (!remark || !fineAmount) {
      throw new Error("Amount and Remark are both required");
    }

    const objToAdd = {
      date: getDate().fullDate,
      approvedBy: req.staff._id,
      amount: fineAmount,
      remark,
    };

    await StudentNew.findOneAndUpdate(
      {
        studentId: _id,
        schoolCode,
        "session.courseId": classId,
      },
      {
        $push: { "session.$.fine": objToAdd },
      }
    );

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Failed to add fine",
      message: e.message,
    });
  }
}

// Add a discount to student
async function addDiscount(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;

    const classId = req.query.classId;
    const discountAmount = req.query.discountAmount;
    const remark = req.query.remark;

    if (discountAmount < 0) {
      throw new Error("Discount cannot be less than 0");
    }

    const objToAdd = {
      date: getDate().fullDate,
      approvedBy: req.staff._id,
      amount: discountAmount,
      remark: remark,
    };

    await StudentNew.findOneAndUpdate(
      {
        studentId: _id,
        schoolCode,
        "session.courseId": classId,
      },
      {
        $push: { "session.$.discount": objToAdd },
      }
    );

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Failed to add discount",
      message: e.message,
    });
  }
}

// Start the bus Service for the student
async function startBusService(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;
    const classId = req.query.classId;
    const location = req.query.location;

    const student = await StudentNew.findOne(
      {
        studentId: _id,
        schoolCode,
        "session.courseId": classId,
      },
      { "session.$": 1 }
    );

    if (!student) {
      throw new Error("Student not found or session does not exist");
    }

    // Check if bus service is already active (bus.0.end exists)
    const session = student.session[0];
    if (session.bus.length > 0 && !session.bus[0].end) {
      throw new Error("Bus service already active for this session");
    }

    const updateResult = await StudentNew.updateOne(
      {
        studentId: _id,
        schoolCode,
        "session.courseId": classId,
      },
      {
        $push: {
          "session.$.bus": {
            $each: [
              {
                place: location,
                start: getDate().fullDate,
              },
            ],
            $position: 0, // This makes sure it is added to the beginning
          },
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to stop the bus service.");
    }

    next();
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      success: false,
      status: "Failed to start bus service",
      message: e.message,
    });
  }
}

// End the bus Service for the student

// End the bus Service for the student
async function endBusService(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;
    const classId = req.query.classId;

    // Step 1: Find the student and check if the bus service is active
    const student = await StudentNew.findOne(
      {
        studentId: _id,
        schoolCode,
        "session.courseId": classId,
      },
      {
        "session.$": 1, // Only retrieve the matching session
      }
    );

    if (!student || !student.session || student.session.length === 0) {
      return res.status(404).send({
        success: false,
        status: "Session not found",
      });
    }

    const busService = student.session[0].bus?.[0]; // Check the first bus entry

    if (!busService || busService.end) {
      return res.status(400).send({
        success: false,
        status: "Bus service is already inactive or not found",
      });
    }

    // Step 2: Update the bus service to end it
    const updateResult = await StudentNew.updateOne(
      {
        studentId: _id,
        schoolCode,
        "session.courseId": classId,
      },
      {
        $set: {
          "session.$.bus.0.end": getDate().fullDate, // Update the first bus entry
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to stop the bus service.");
    }

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Failed to stop bus service",
      message: e.message,
    });
  }
}

// Pay student Fee by school Management Staffs
async function payFees(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;
    const classId = req.query.classId;
    const amount = req.query.amount;
    const remark = req.query.remark;

    const year = getDate().year;

    if (amount < 0) {
      throw new Error("Amount cannot be less than 0");
    }

    const dateAndTime = getCurrentNepaliDate();

    const objToAdd = {
      date: dateAndTime.nepaliDate,
      time: dateAndTime.nepaliTime,
      approvedBy: req.staff._id,
      amount: amount,
      remark: remark,
      method: "Cash",
      student: _id,
    };

    await StudentNew.findOneAndUpdate(
      {
        studentId: _id,
        schoolCode,
        "session.courseId": classId,
      },
      {
        $push: { "session.$.paymentHistory": objToAdd },
      }
    );

    // Add the data to payment history
    await Account.findOneAndUpdate(
      { schoolCode, year },
      {
        $push: {
          paymentHistory: objToAdd,
        },
      },
      { new: true, upsert: true }
    );

    next();
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      success: false,
      status: "Failed to pay fees",
      message: e.message,
    });
  }
}

// Add a book to student's lended list
async function addBook(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;

    const classId = req.query.classId;
    const book = req.query.book;
    let date = req.query.date;
    let returnDate = req.query.returnDate;

    if (book.length < 1) {
      throw new Error("Book name is required");
    }

    // check regex for the valid date
    if (!date) {
      date = getDate().fullDate;
    }
    if (!returnDate) {
      returnDate = `${getDate().year + 1}-01-01`;
    }

    var dateRegex = /^(\d{4})(\/|-)(0[1-9]|1[0-2])\2(0[1-9]|[12]\d|3[01])$/;
    if (!dateRegex.test(date)) {
      throw new Error("Date you entered is not in proper format");
    }
    if (!dateRegex.test(returnDate)) {
      throw new Error("Return date you entered is not in proper format");
    }

    const objToAdd = {
      date,
      approvedBy: req.staff._id,
      book,
      returnDate,
      status: "Not Returned",
    };
    await StudentNew.findOneAndUpdate(
      {
        studentId: _id,
        schoolCode,
        "session.courseId": classId,
      },
      {
        $push: { "session.$.library": objToAdd },
      }
    );

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Failed to add fine",
      message: e.message,
    });
  }
}

// Return books taken by the students
async function returnBooks(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;
    const classId = req.query.classId;
    const booksId = JSON.parse(req.query.allIds);

    const studentUpdateResult = await StudentNew.updateOne(
      {
        schoolCode,
        studentId: _id,
        "session.courseId": classId,
        "session.library._id": { $in: booksId },
        "session.library.status": "Not Returned",
        // Ensure the book is not already returned
      },
      {
        $set: {
          "session.$.library.$[book].status": "Returned",
          "session.$.library.$[book].returnedDate": getDate().fullDate,
        },
      },
      {
        arrayFilters: [{ "book._id": { $in: booksId } }], // Filter to match the specific books
      }
    );

    if (studentUpdateResult.nModified === 0) {
      throw new Error("No books found to update or books are already returned");
    }

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Failed to return books",
      message: e.message,
    });
  }
}

// Change the student course
async function changeCourse(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;

    const { groupId, sectionId, classId } = req.body.cCourse;
    const newCourse = req.body.nCourse;

    // Check if the request body is in the expected format
    if (
      !groupId ||
      !sectionId ||
      !classId ||
      !newCourse.groupId ||
      !newCourse.sectionId ||
      !newCourse.classId
    ) {
      return res.status(400).send({
        success: false,
        status: "Bad Request",
        message: "Invalid request body format",
      });
    }

    // get the student and update the course
    const student = await StudentNew.findOneAndUpdate(
      {
        studentId: _id,
        schoolCode,
        "session.courseId": classId,
      },
      {
        $set: { "session.$.courseId": newCourse.classId },
      },
      { new: true }
    );

    await Promise.all([
      // delete the student from the old section
      await SectionNew.findOneAndUpdate(
        { _id: sectionId, schoolCode },
        {
          $pull: { students: student._id },
        }
      ),

      // add the student to the new section
      await SectionNew.findOneAndUpdate(
        { _id: newCourse.sectionId, schoolCode },
        {
          $push: { students: student._id },
        }
      ),

      // update the student in school schema
      await School.findOneAndUpdate(
        {
          schoolCode: schoolCode,
          "students._id": _id,
        },
        {
          $set: {
            "students.$[student].course.class": newCourse.classId,
            "students.$[student].course.group": newCourse.groupId,
            "students.$[student].course.section": newCourse.sectionId,
          },
        },
        {
          arrayFilters: [{ "student._id": _id }],
        }
      ),
    ]);

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Failed to update student course",
      message: e.message,
    });
  }
}

// get all students from the course schema
async function getAllStudentsFromCourse(req, res, next) {
  try {
    const { classId, sectionId } = req.query;
    const { schoolCode } = req.params;

    const section = await SectionNew.findOne({
      _id: sectionId,
      schoolCode,
    }).populate("students");

    // Map the student data to return the required fields
    // and also here i am making sure i use studentId not _id from studentNew
    // i don't know why am i use this but it feels so good to use it.. HAHAHAAH

    const students = section.students.map((std) => ({
      name: std.name,
      _id: std.studentId,
      absentdays: std.session.find((ses) => ses.courseId.toString() === classId)
        .absentDays,
    }));

    req.students = students;

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Get Students Failed",
      message: e.message,
    });
  }
}

// take attendance of a particular class
async function takeAttendance(req, res, next) {
  try {
    const { classId, sectionId } = req.query;
    const absentStudents = JSON.parse(req.query.absentStudents);
    const { schoolCode } = req.params;

    if (!sectionId || !classId || !absentStudents || !schoolCode) {
      return res.status(400).send({
        success: false,
        status: "Failed to take attendance",
        message: "Invalid request parameters",
      });
    }

    const today = getDate().fullDate;

    // Fetch the section and populate the students
    const section = await SectionNew.findOne({
      _id: sectionId,
      schoolCode,
    }).populate("students");

    if (!section) {
      return res.status(404).send({
        success: false,
        status: "Failed to take attendance",
        message: "Section not found",
      });
    }

    const students = section.students;
    // Process each student
    await Promise.all(
      students.map(async (student) => {
        const isAbsent = absentStudents.includes(student.studentId.toString());

        // Find the session for the given classId
        const session = student.session.find(
          (s) => s.courseId.toString() === classId
        );

        if (!session) return;

        // Check if the student already has an absence for today
        const alreadyAbsent = session.absentDays.some((absence) =>
          isSameDay(absence.date, today)
        );

        if (isAbsent) {
          if (!alreadyAbsent) {
            // Add absence if not already present
            session.absentDays.push({
              date: today,
              reason: "unknown",
            });
          }
        } else {
          if (alreadyAbsent) {
            // Remove absence if no longer present
            session.absentDays = session.absentDays.filter(
              (absence) => !isSameDay(absence.date, today)
            );
          }
        }

        // Save the student document with updated absence record
        await student.save();
      })
    );

    const sectionInfo = await SectionNew.findOne({
      _id: sectionId,
      schoolCode,
    }).select("workingDates");

    // Convert each date in sectionInfo.workingDates to a string (YYYY-MM-DD) and check if today's date exists
    const isDateInArray = sectionInfo.workingDates.some((date) => {
      const formattedDate = date.toISOString().split("T")[0]; // Format the Mongoose Date object as YYYY-MM-DD
      return formattedDate === today;
    });

    if (!isDateInArray) {
      // Convert today's string to a Date object before adding
      sectionInfo.workingDates.push(new Date(today));
      await sectionInfo.save();
    }

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Failed to take attendance",
      message: e.message,
    });
  }
}

// update the student profile
async function studentProfileUpdate(req, res, next) {
  try {
    const { schoolCode, _id } = req.params;
    const data = JSON.parse(req.body.student);

    if (req.files["photo1"]) {
      data.photo1 = await photoWork(req.files["photo1"][0]);
    }

    if (req.files["photo2"]) {
      data.photo2 = await photoWork(req.files["photo2"][0]);
    }

    if (req.files["photo3"]) {
      data.photo3 = await photoWork(req.files["photo3"][0]);
    }

    if (req.files["photo4"]) {
      data.photo4 = await photoWork(req.files["photo4"][0]);
    }

    // Remove unwanted fields
    const unwantedFields = [
      "status",
      "loginId",
      "schoolCode",
      "password",
      "amount",
      "scholarship",
      "paymentHistory",
      "bus",
      "result",
      "absentDays",
      "library",
      "scholib",
      "tokens",
    ];

    unwantedFields.forEach((field) => delete data[field]);

    // Update student document
    const updatedStudent = await Student.findOneAndUpdate({ _id }, data, {
      new: true,
    });
    await Promise.all([
      School.findOneAndUpdate(
        { schoolCode, "students._id": _id },
        { $set: { "students.$": updatedStudent } },
        { new: true }
      ),
      StudentNew.findOneAndUpdate(
        {
          studentId: _id,
          schoolCode,
        },
        {
          $set: { name: data.name },
        }
      ),
    ]);

    req.student = updatedStudent;
    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Student Profile updation failed`,
      message: e.message,
    });
  }
}

// ***************** below here are not optimized and are all old codes ************************

// Suspend student from school this one is okay but i am not sure will i ever use it or not
async function suspendStudent(req, res, next) {
  try {
    const { schoolCode, _id } = req.params;
    const student = await Student.findOne({ _id, schoolCode });

    student.status = "suspended";
    req.student = await student.save();

    await School.findOneAndUpdate(
      { schoolCode, "students._id": _id },
      { $set: { "students.$": req.student } }
    );

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Student failed to suspend",
      message: e.message,
    });
  }
}

// *************************** Here i have a basic level of modification and they works but i guess there is a space for more *************************

// Delete student from school and from the course okay and this one has atomicity
async function deleteStudent(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;
    const year = getDate().year;

    // Find the student first
    const school = await School.findOne(
      { schoolCode, "students._id": _id },
      { "students.$": 1 } // Only return the matching student
    );

    if (!school || !school.students || !school.students.length) {
      return res.status(404).send({
        success: false,
        status: "Student not found",
        message: "No student found with the given ID",
      });
    }

    const deletedStudent = school.students[0]; // Extract the student
    const sectionId = deletedStudent.course.section;

    // Now delete the student from school
    await School.findOneAndUpdate(
      { schoolCode },
      { $pull: { students: { _id } } }
    );

    // Push the deleted student to OlderData
    const olderData = await OlderData.findOneAndUpdate(
      { schoolCode, year },
      { $push: { students: deletedStudent } },
      { new: true, upsert: true }
    );

    // Add olderData ID to School if new
    if (olderData && olderData.isNew) {
      await School.findOneAndUpdate(
        { schoolCode },
        {
          $push: {
            olderData: {
              $each: [olderData], // Wrap `olderData` in an array
              $position: 0, // Add at the beginning of the array
            },
          },
        },
        { new: true }
      );
    }

    const student = await StudentNew.findOne({ schoolCode, studentId: _id });
    if (!student) {
      return res.status(404).send({
        success: false,
        status: "Student not found in StudentNew",
        message: "No student found in StudentNew with the given ID",
      });
    }

    await SectionNew.findOneAndUpdate(
      { schoolCode, _id: sectionId },
      { $pull: { students: student._id } }
    );

    next();
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      success: false,
      status: "Failed to delete the student",
      message: e.message,
    });
  }
}

//accept school admission
const acceptAdmission = async (req, res, next) => {
  try {
    const { schoolCode, _id } = req.params;

    const school = await School.findOne({ schoolCode }).populate({
      path: "course2",
      populate: {
        path: "groups",
        populate: {
          path: "sections",
          populate: {
            path: "students",
          },
        },
      },
    });
    if (!school) {
      return res.status(404).send({
        success: false,
        status: "School not found",
        message: `The school you are looking for isn't found. Try checking your schoolCode `,
      });
    }

    if (!school.admissions.find((adm) => adm._id.toString() == _id)) {
      throw new Error("Student is not in waiting...");
    }

    let student = await Student.findOne({ _id, schoolCode });
    if (!student) {
      return res.status(400).send({
        success: false,
        status: "Student Not Found",
        message: "The student you are trying to admit doesn't exist",
      });
    }

    student.status = "active";

    function generateOTP() {
      const characters = "0123456789abcdefghijklmnopqrstuvwxyz";
      let otp = "";
      for (let i = 0; i < 8; i++) {
        otp += characters[Math.floor(Math.random() * characters.length)];
      }
      return otp;
    }

    let tempPass = generateOTP();
    student.password = tempPass;

    const mailOptions = {
      from: process.env.EMAIL_ID1,
      to: student.email,
      subject: `Scholib account created || Login to ${school.name}`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>School account created </title>
      <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            background-color: #4CAF50;
            padding: 10px;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
        }
        .content {
            padding: 20px;
        }
        .content p {
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
        }
        .login-details {
            background-color: #f9f9f9;
            padding: 10px;
            border: 1px solid #dddddd;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            font-size: 14px;
            color: #777777;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Scholib!</h1>
        </div>
        <div class="content">
            <p>Dear ${student.name},</p>
            <p>Your scholib account has been created. Now you can login to your school through the following credentials</p>
            <p>Visit scholib.com and login through the following credentials</p>
            <div class="login-details">
                <p><strong>School Code:</strong> ${school.schoolCode}</p>
                <p><strong>Login ID:</strong> ${student.loginId}</p>
                <p><strong>Password:</strong> ${tempPass}</p>
            </div>
            <p>Please keep this information secure and do not share it with anyone.</p>
            <p>Best regards,<br>Scholib.com</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Scholib.com. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

      `,
    };

    const courseId = student.course.class;
    const groupId = student.course.group;
    const course = school.course2;

    // Find the course with the provided courseId
    const selectedCourse = course.find(
      (crc) => crc.courseId.toString() === courseId
    );
    if (!selectedCourse) {
      throw new Error("Course not found");
    }

    // Find the group with the provided groupId
    const selectedGroup = selectedCourse.groups.find(
      (grp) => grp.groupId.toString() === groupId
    );
    if (!selectedGroup) {
      throw new Error("Group not found");
    }

    // Get all sections from the selected group
    const allSections = selectedGroup.sections;

    // Generate a random section index
    const rSectionIndex = Math.floor(Math.random() * allSections.length);
    const sectionId = allSections[rSectionIndex]._id;

    const studentInfo = new StudentNew({
      name: student.name,
      schoolCode,
      _id: student._id,
      studentId: student._id,
      session: {
        courseId: selectedCourse._id,
      },
    });

    const student01 = await studentInfo.save();

    // Push the student into the randomly selected section
    await SectionNew.findByIdAndUpdate(
      sectionId,
      { $push: { students: student01._id } },
      { new: true, useFindAndModify: false }
    );

    // Remove student from admissions and add to students list
    school.admissions = school.admissions.filter(
      (adm) => adm._id.toString() !== _id
    );

    // update students field from admissions with the correct course, group and section
    const student2 = JSON.parse(JSON.stringify(student));
    student2.course.section = allSections[rSectionIndex]._id;
    student2.course.class = selectedCourse._id;
    student2.course.group = selectedGroup._id;
    school.students.push(student2);

    await Promise.all([student.save(), school.save()]);
    sendMail(mailOptions);

    next();
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send({
      success: false,
      status: "Something went wrong",
      message: e.message,
    });
  }
};

//Update and Accept School Admission
const updateAndAcceptAdmission = async (req, res, next) => {
  try {
    const { schoolCode, _id } = req.params;

    const school = await School.findOne({ schoolCode }).populate({
      path: "course2",
      populate: {
        path: "groups",
        populate: {
          path: "sections",
          populate: {
            path: "students",
          },
        },
      },
    });
    if (!school) {
      return res.status(404).send({
        success: false,
        status: "School not found",
        message: `The school you are looking for isn't found. Try checking your schoolCode `,
      });
    }

    if (!school.admissions.find((adm) => adm._id.toString() == _id)) {
      throw new Error("Student is not in waiting...");
    }

    const studentData = JSON.parse(req.body.student);
    const bus = studentData.bus;
    studentData.status = "active";

    //some checkups
    studentData.schoolCode = schoolCode;
    delete studentData.year;
    delete studentData.amount;
    delete studentData.scholarship;
    delete studentData.paymentHistory;
    delete studentData.result;
    delete studentData.absentdays;
    delete studentData.library;
    delete studentData.scholib;
    delete studentData.tokens;

    delete studentData.bus;

    // some photo works

    if (req.files["photo1"]) {
      studentData.photo1 = await photoWork(req.files["photo1"][0]);
    }

    if (req.files["photo2"]) {
      studentData.photo2 = await photoWork(req.files["photo2"][0]);
    }

    if (req.files["photo3"]) {
      studentData.photo3 = await photoWork(req.files["photo3"][0]);
    }

    if (req.files["photo4"]) {
      studentData.photo4 = await photoWork(req.files["photo4"][0]);
    }

    // here in studentData i have to check for the nearest place from the school and add the bus fee here in studentData.bus.location and studentData.bus.amount

    const busPlace = school.busFee.map((obj) => {
      return obj.location.toString() === bus;
    });

    if (busPlace && busPlace.loaction) {
      studentData.bus = [
        {
          place: busPlace.location,
          start: getDate().fullDate,
        },
      ];
    }

    function generateOTP() {
      const characters = "0123456789abcdefghijklmnopqrstuvwxyz";
      let otp = "";
      for (let i = 0; i < 8; i++) {
        otp += characters[Math.floor(Math.random() * characters.length)];
      }
      return otp;
    }

    let tempPass = generateOTP();
    studentData.password = tempPass;

    let student = await Student.findOne({ _id, schoolCode });

    Object.assign(student, studentData);
    let updatedDoc1 = await student.save();

    if (!updatedDoc1) {
      return res.status(404).send({
        success: false,
        status: "Student not found",
        message: "The student you are looking for doesn't exists",
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_ID1,
      to: updatedDoc1.email,
      subject: `Scholib account created || Login to ${school.name}`,
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>School account created </title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            background-color: #4CAF50;
            padding: 10px;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
        }
        .content {
            padding: 20px;
        }
        .content p {
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
        }
        .login-details {
            background-color: #f9f9f9;
            padding: 10px;
            border: 1px solid #dddddd;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            font-size: 14px;
            color: #777777;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Scholib!</h1>
        </div>
        <div class="content">
            <p>Dear ${updatedDoc1.name},</p>
            <p>Your scholib account has been created. Now you can login to your school through the following credentials</p>
            <p>Visit scholib.com and login through the following credentials</p>
            <div class="login-details">
                <p><strong>School Code:</strong> ${school.schoolCode}</p>
                <p><strong>Login ID:</strong> ${updatedDoc1.loginId}</p>
                <p><strong>Password:</strong> ${tempPass}</p>
            </div>
            <p>Please keep this information secure and do not share it with anyone.</p>
            <p>Best regards,<br>Scholib.com</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Scholib.com. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

      `,
    };

    sendMail(mailOptions);

    let updatedDoc = JSON.parse(JSON.stringify(updatedDoc1));

    const courseId = updatedDoc.course.class;
    const groupId = updatedDoc.course.group;

    const course = school.course2;

    // Find the course with the provided courseId
    const selectedCourse = course.find(
      (crc) => crc.courseId.toString() === courseId
    );
    if (!selectedCourse) {
      throw new Error("Course not found");
    }

    // Find the group with the provided groupId
    const selectedGroup = selectedCourse.groups.find(
      (grp) => grp.groupId.toString() === groupId
    );
    if (!selectedGroup) {
      throw new Error("Group not found");
    }

    // Get all sections from the selected group
    const allSections = selectedGroup.sections;

    // Generate a random section index
    const rSectionIndex = Math.floor(Math.random() * allSections.length);
    const sectionId = allSections[rSectionIndex]._id;

    const studentInfo = new StudentNew({
      name: updatedDoc.name,
      _id: updatedDoc._id,
      studentId: updatedDoc._id,
      schoolCode,
      session: {
        courseId: selectedCourse._id,
      },
    });

    const student01 = await studentInfo.save();

    // Push the student into the randomly selected section
    await SectionNew.findByIdAndUpdate(
      sectionId,
      { $push: { students: student01._id } },
      { new: true, useFindAndModify: false }
    );

    // Remove student from admissions and add to students list
    school.admissions = school.admissions.filter(
      (adm) => adm._id.toString() !== _id
    );

    // update students field from admissions with the correct course, group and section
    const student2 = JSON.parse(JSON.stringify(student));
    student2.course.section = allSections[rSectionIndex]._id;
    student2.course.class = selectedCourse._id;
    student2.course.group = selectedGroup._id;
    school.students.push(student2);

    await Promise.all([student.save(), school.save()]);
    sendMail(mailOptions);

    next();
  } catch (e) {
    res.status(500).send({
      success: false,
      status: "Something went wrong",
      message: e.message,
    });
    return;
  }
};

module.exports = {
  getStudentFromCourse,
  startBusService,
  endBusService,
  getAllStudentsFromCourse,
  studentProfileUpdate,
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
  takeAttendance,
  deleteAdmission,
  getStudentExamInfo,
};
