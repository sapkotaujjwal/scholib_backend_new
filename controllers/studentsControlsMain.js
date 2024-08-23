const Course = require("../schemas/courseSchema");
const { School } = require("../schemas/schoolSchema");
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

    // Define the update operation
    const updateResult = await StudentNew.updateOne(
      {
        studentId: _id,
        schoolCode,
        "session.courseId": classId,
        "session.bus.0.end": { $exists: false }, // Check if bus service is already active
      },
      {
        $push: {
          "session.$.bus": {
            place: location,
            start: getDate().fullDate,
          },
        },
      }
    );

    // Check if the update operation modified any documents
    if (updateResult.matchedCount === 0) {
      throw new Error("Something went wrong");
    }

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Failed to start bus service",
      message: e.message,
    });
  }
}

// End the bus Service for the student
async function endBusService(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;
    const classId = req.query.classId;

    // Update the bus service status
    const updateResult = await StudentNew.updateOne(
      {
        studentId: _id,
        schoolCode,
        "session.courseId": classId,
        "session.bus.end": { $exists: false }, // Check if the bus service is currently active
      },
      {
        $set: {
          "session.$.bus.$[bus].end": getDate().fullDate,
        },
      },
      {
        arrayFilters: [
          { "bus.end": { $exists: false } }, // Ensure the bus entry is active
        ],
      }
    );

    // If no documents were updated, throw an error
    if (updateResult.matchedCount === 0) {
      throw new Error("Bus service is already inactive or session not found");
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

// ***************** below here are not optimized and are all old codes ************************

// Suspend student from school
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

    // Update corresponding student record in the school document
    const schoolUpdate = await School.findOneAndUpdate(
      { schoolCode, "students._id": _id },
      { $set: { "students.$": updatedStudent } },
      { new: true }
    );

    // Update student's name in the course document
    const studentData = schoolUpdate.students.find(
      (std) => std._id.toString() === _id
    ).course;
    const groupId = studentData.group;
    const sectionId = studentData.section;
    const classId = studentData.class;

    await Course.findOneAndUpdate(
      {
        schoolCode,
        "course._id": classId,
        "course.groups._id": groupId,
        "course.groups.sections._id": sectionId,
        "course.groups.sections.students._id": _id,
        "course.groups.sections.students.bus": { $exists: true },
      },
      {
        $set: {
          "course.$[class].groups.$[group].sections.$[section].students.$[student].name":
            updatedStudent.name,
        },
      },
      {
        arrayFilters: [
          { "class._id": classId },
          { "group._id": groupId },
          { "section._id": sectionId },
          { "student._id": _id },
        ],
        new: true,
      }
    );

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

// get all students from the course schema
async function getAllStudentsFromCourse(req, res, next) {
  try {
    const { sectionId, groupId, classId } = req.query;

    const course = await Course.findOne({
      schoolCode: req.staff.schoolCode,
    }).select("course");

    if (!course) {
      return res.status(404).send({
        success: false,
        status: "Course not found",
        message: "Course not found for the given school code",
      });
    }

    // Find the class by ID
    const classData = course.course.find(
      (clc) => clc._id.toString() === classId
    );
    if (!classData) {
      return res.status(404).send({
        success: false,
        status: "Class not found",
        message: "Class not found for the given class ID",
      });
    }

    // Find the group within the class
    const groupData = classData.groups.find(
      (grp) => grp._id.toString() === groupId
    );
    if (!groupData) {
      return res.status(404).send({
        success: false,
        status: "Group not found",
        message: "Group not found for the given group ID",
      });
    }

    // Find the section within the group
    const sectionData = groupData.sections.find(
      (sec) => sec._id.toString() === sectionId
    );
    if (!sectionData) {
      return res.status(404).send({
        success: false,
        status: "Section not found",
        message: "Section not found for the given section ID",
      });
    }

    // Map the student data to return the required fields
    const students = sectionData.students.map((std) => ({
      name: std.name,
      _id: std._id,
      absentdays: std.absentdays,
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
    const { sectionId, groupId, classId } = req.query;
    const absentStudents = JSON.parse(req.query.absentStudents);
    const schoolCode = req.staff.schoolCode; // Assuming schoolCode is a property of req.staff

    if (!sectionId || !groupId || !classId || !absentStudents || !schoolCode) {
      return res.status(400).send({
        success: false,
        status: "Failed to take attendance",
        message: "Invalid request parameters",
      });
    }

    const course = await Course.findOne({
      schoolCode: schoolCode,
      "course._id": classId,
      "course.groups._id": groupId,
      "course.groups.sections._id": sectionId,
    });

    if (!course) {
      return res.status(404).send({
        success: false,
        status: "Failed to take attendance",
        message: "Course not found",
      });
    }

    const currentDate = getDate().fullDate;

    course.course.forEach((c) => {
      if (c._id.toString() === classId) {
        c.groups.forEach((group) => {
          if (group._id.toString() === groupId) {
            group.sections.forEach((section) => {
              if (section._id.toString() === sectionId) {
                section.workingDates.push(currentDate);
                section.students.forEach((student) => {
                  const studentId = student._id.toString();
                  const isAbsent = absentStudents.includes(studentId);

                  if (isAbsent) {
                    // Check if the student already has an absence for the current date
                    const alreadyAbsent = student.absentdays.some((absentDay) =>
                      isSameDay(absentDay.date, currentDate)
                    );

                    if (!alreadyAbsent) {
                      student.absentdays.push({
                        date: currentDate,
                        reason: "unknown",
                      });
                    }
                  } else {
                    // Remove the absence for the current date if the student is no longer absent
                    student.absentdays = student.absentdays.filter(
                      (absentDay) => !isSameDay(absentDay.date, currentDate)
                    );
                  }
                });
              }
            });
          }
        });
      }
    });

    await course.save();

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Failed to take attendance",
      message: e.message,
    });
  }
}

// Delete student from school and from the course
async function deleteStudent(req, res, next) {
  try {
    const { _id, schoolCode } = req.params;

    const groupId = req.query.groupId;
    const sectionId = req.query.sectionId;
    const classId = req.query.classId;

    await Course.findOneAndUpdate(
      {
        schoolCode: schoolCode,
        "course._id": classId,
        "course.groups._id": groupId,
        "course.groups.sections._id": sectionId,
        "course.groups.sections.students._id": _id,
        "course.groups.sections.students.bus": { $exists: true },
      },
      {
        $set: {
          "course.$[class].groups.$[group].sections.$[section].students.$[student].bus.$[element].end":
            getDate().fullDate,
        },
      },
      {
        arrayFilters: [
          { "class._id": classId },
          { "group._id": groupId },
          { "section._id": sectionId },
          { "student._id": _id },
          { "element.end": { $exists: true } }, // Ensuring to target bus elements with existing end field
        ],
        new: true,
      }
    );

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Failed to stop bus service",
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
        { sectionId: sectionId, schoolCode },
        {
          $pull: { students: student._id },
        }
      ),

      // add the student to the new section
      await SectionNew.findOneAndUpdate(
        { sectionId: newCourse.sectionId, schoolCode },
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

// *************************** Here i have a basic level of modification *************************

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
      from: "no-reply@ujjwalsapkota.name.np",
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
      from: "no-reply@ujjwalsapkota.name.np",
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

  // here i have the ones which are already latest version

  deleteAdmission,
};
