const cloudinary = require("../config/cloudinary");
const Course = require("../schemas/courseSchema");
const { School, OlderData } = require("../schemas/schoolSchema");
const Staff = require("../schemas/staffSchema");
const Gallery = require("../schemas/gallerySchema");
const { photoWork } = require("../config/photoWork");
const { getDate } = require("../config/nepaliDate");
const { calculateStudentFee } = require("../config/studentCalc");
const Exam = require("../schemas/examSchema");
const { sendMail } = require("../config/sendEmail");
const { CourseNew, GroupNew, SectionNew } = require("../schemas/courseSchema");

// Create a new course and save it in school schema
const createCourse2 = async (req, res, next) => {
  try {
    const schoolCode = req.params.schoolCode;
    const data = req.body;

    if (data.fees.find((dat) => dat.amount < 0)) {
      throw new Error("No fee amount can be less than 0");
    }

    // add the object to the course
    const createdCourse = await School.findOneAndUpdate(
      { schoolCode },
      {
        $push: { course: data },
      }
    );

    req.course = createdCourse;
    next();
  } catch (e) {
    console.log(e);
    return res.status(400).send({
      success: false,
      status: "Course creation failed",
      message: e.message,
    });
  }
};

// Update our course next
const updateCourseNext = async (req, res, next) => {
  try {
    const schoolCode = req.params.schoolCode;
    const school = await School.findOne({ schoolCode });
    const data = req.body;

    data.map((dat) => {
      if (
        dat.class &&
        dat.next &&
        dat.class.toString() === dat.name.toString()
      ) {
        throw new Error("Wrong");
      }
    });

    school.course.map((clc) => {
      let nextClass =
        data.find((dat) => dat.class === clc._id.toString()).next || null;
      clc.next = nextClass;
    });

    await school.save();
    next();
  } catch (e) {
    return res.status(400).send({
      success: false,
      status: "Courses Updation failed",
      message: e.message,
    });
  }
};

// update our course
async function updateCourse(req, res, next) {
  try {
    const { schoolCode } = req.params;
    const { _id } = req.params;

    const course = await Course.findOne({ schoolCode });

    if (!course) {
      return res.status(403).send({
        success: false,
        status: `Course updation failed`,
        message: ` Course not found for schoolCode ${schoolCode} `,
      });
    }

    const newCourse = req.body;

    if (newCourse.fees.find((dat) => dat.amount < 0)) {
      throw new Error("No fee amount can be less than 0");
    }

    course.course = course.course.filter((obj) => obj._id != _id);

    course.course.unshift(newCourse);
    await course.save();
    req.course = course;
    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Course updation failed`,
      message: e.message,
    });
  }
}

// Add new Exam
async function addExam(req, res, next) {
  try {
    const schoolCode = req.staff.schoolCode;
    const classesList = JSON.parse(req.query.classesList);

    const courses = await CourseNew.find({ _id: { $in: classesList } })
      .populate({
        path: "groups",
        populate: {
          path: "sections",
          model: "SectionNew",
        },
      })
      .exec();

    const getAllSections = (courses) => {
      const sections = courses
        .flatMap((course) => course.groups)
        .flatMap((group) => group.sections);
      return sections;
    };

    const allSections = getAllSections(courses);

    const obj = allSections.map((sec) => {
      let students = sec.students.map((stu) => {
        return { student: stu };
      });

      return {
        exam: sec.exam,
        subjects: sec.subjects.map((sub) => {
          return {
            subject: sub.subject,
            students: students,
            _id: sub._id,
            fullMarks: 100,
            passMarks: 40,
          };
        }),
      };
    });

    obj.map(async (eac) => {
      await Exam.updateOne(
        { _id: eac.exam, schoolCode: schoolCode },
        {
          $push: {
            term: { subjects: eac.subjects },
          },
        }
      );
    });

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Exam failed to add",
      message: e.message,
    });
  }
}

// Publish Result
async function publishResult(req, res, next) {
  try {
    const schoolCode = req.staff.schoolCode;
    const examIds = JSON.parse(req.query.examsList);
    const currentDate = getDate().fullDate;

    await Exam.updateMany(
      { _id: { $in: examIds }, schoolCode },
      {
        $set: {
          "term.$[].status": "Published",
          "term.$[].publishedDate": currentDate,
        },
      },
      { multi: true }
    );

    next();
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      success: false,
      status: "Result failed to publish",
      message: e.message,
    });
  }
}

// get exam info
async function getExamInfo(req, res, next) {
  try {
    const schoolCode = req.staff.schoolCode;
    const sectionIds = req.query.sectionIds;

    const sections = await SectionNew.find({
      _id: { $in: sectionIds },
      schoolCode,
    })
      .populate("exam")
      .exec();

    if (sections.length === 0) {
      return res.status(404).send({
        success: false,
        status: "Exam not found",
        message: "No exam record found for the given class.",
      });
    }

    req.data = sections.map((ind) => {
      return {
        section: ind._id,
        exam: ind.exam,
      };
    });

    if (!req.data[0]) {
      return res.status(404).send({
        success: false,
        status: "Exam not found",
        message: "No exam record found for the given class.",
      });
    }

    next();
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      success: false,
      status: "Exam info failed to get",
      message: e.message,
    });
  }
}

async function deleteGallery(req, res, next) {
  try {
    const { schoolCode, _id } = req.params;
    const gallery = await Gallery.findOne({ schoolCode });

    if (!gallery) {
      return res.status(404).send({
        success: false,
        status: "Not found",
        message: `Gallery schema for school code ${schoolCode} isn't found`,
      });
    }

    const filteredObject = gallery.gallery.find((obj) => obj._id.equals(_id));

    await cloudinary.uploader.destroy(
      filteredObject.image.public_id,
      (error, result) => {
        if (error) {
          return res.status(500).send({
            success: false,
            status: "Image deletion failed",
            message: `${error.message}`,
          });
        }
      }
    );

    gallery.gallery = gallery.gallery.filter((image) => image._id != _id);
    await gallery.save();
    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Image deletion failed",
      message: e.message,
    });
  }
}

async function staffProfileUpdate(req, res, next) {
  try {
    const { schoolCode, _id } = req.params;
    const data = JSON.parse(req.body.staff);

    if (req.files && req.files["pPhoto"]) {
      for (const file of req.files["pPhoto"]) {
        const photo = await photoWork(file);
        const image = {
          blurHash: photo.blurHash,
          secure_url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        data.pPhoto = image;
      }
    }

    if (!req.staff.role === "Administrator") {
      delete data.role;
    }

    delete data.email;
    delete data.status;
    delete data.loginId;
    delete data.schoolCode;
    delete data.password;
    delete data.salary;
    delete data.paymentHistory;
    delete data.absentDays;
    delete data.tokens;

    const updatedDoc = await Staff.findByIdAndUpdate({ _id }, data, {
      new: true,
    });

    const updatedSchool = await School.findOneAndUpdate(
      { schoolCode, "staffs._id": _id },
      { $set: { "staffs.$": updatedDoc } },
      { new: true }
    );

    req.staff = updatedDoc;

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Staff's Profile Updation Failed`,
      message: e.message,
    });
  }
}

async function createNewStaff(req, res, next) {
  try {
    const schoolCode = parseInt(req.params.schoolCode);
    const school = await School.findOne({ schoolCode: schoolCode });

    if (!school) {
      return res.status(404).send({
        success: false,
        status: "School not found",
        message: "The school you are looking for doesn't exists",
      });
    }

    const staffData = JSON.parse(req.body.staff);

    if (req.files && req.files["pPhoto"]) {
      for (const file of req.files["pPhoto"]) {
        const photo = await photoWork(file);
        const image = {
          blurHash: photo.blurHash,
          secure_url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        staffData.pPhoto = image;
      }
    }

    delete staffData.status;
    delete staffData.loginId;
    delete staffData.otp;
    delete staffData.password;
    delete staffData.tokens;

    staffData.schoolCode = schoolCode;

    function generateOTP() {
      const characters = "0123456789abcdefghijklmnopqrstuvwxyz";
      let otp = "";
      for (let i = 0; i < 8; i++) {
        otp += characters[Math.floor(Math.random() * characters.length)];
      }
      return otp;
    }

    let tempPass = generateOTP();
    staffData.password = tempPass;

    const staffFinal = new Staff(staffData);
    const createdStaff = await staffFinal.save();

    const mailOptions = {
      from: process.env.EMAIL_ID1,
      to: createdStaff.email,
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
            <p>Dear ${createdStaff.name},</p>
            <p>Your scholib account has been created. Now you can login to your school through the following credentials</p>
            <p>Visit scholib.com and login through the following credentials</p>
            <div class="login-details">
                <p><strong>School Code:</strong> ${school.schoolCode}</p>
                <p><strong>Login ID:</strong> ${createdStaff.loginId}</p>
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

    school.staffs.push(createdStaff);

    // Save the updated school
    await school.save();

    req.data = createdStaff;
    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Staff Creation Failed`,
      message: e.message,
    });
  }
}

//find school courses
const findSchoolCoursesAdmin = async (req, res, next) => {
  try {
    const schoolCode = req.params.schoolCode;

    const courses = await School.findOne(
      { schoolCode },
      { course2: 1, _id: 0 }
    ).populate({
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

    if (!courses) {
      return res
        .status(404)
        .send("Course you are searching for doesn't exists");
    }

    req.data = courses.course2;
    next();
  } catch (e) {
    console.log(e);
    res.status(500).send({
      success: false,
      status: "Something went wrong",
      message: e.message,
    });
    return;
  }
};

// find school admissions
const findSchoolAdmissions = async (req, res, next) => {
  try {
    const schoolCode = req.params.schoolCode;

    const school = await School.findOne({ schoolCode });
    if (!school) {
      return res.status(404).send({
        success: false,
        status: "School not found",
        message: `The school you are looking for isn't found. Try checking your schoolCode `,
      });
    }

    req.data = school.admissions;

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

//delete a school bus route
const delteBusRoute = async (req, res, next) => {
  try {
    const { schoolCode, _id } = req.params;

    const updatedSchool = await School.findOneAndUpdate(
      { schoolCode, "busFee._id": _id },
      { $set: { "busFee.$.active": false } },
      { new: true }
    );

    if (!updatedSchool) {
      throw new Error("Bus Route you wanted to delete doesn't exist");
    }

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

//Add a school bus route
const addBusRoute = async (req, res, next) => {
  try {
    const { schoolCode } = req.params;
    const newBusRoute = req.body;

    if (!newBusRoute.location || !newBusRoute.amount) {
      throw new Error("Title and Amount is Must");
    }

    if (newBusRoute.amount < 0) {
      throw new Error("Amount cannot be less than 0");
    }

    console.log(newBusRoute);

    const updatedSchool = await School.findOneAndUpdate(
      { schoolCode },
      {
        $push: {
          busFee: {
            location: newBusRoute.location,
            amounts: [
              {
                date: getDate().fullDate,
                amount: newBusRoute.amount,
              },
            ],
            active: true,
          },
        },
      },
      { new: true }
    );

    if (!updatedSchool) {
      throw new Error("School not found or unable to update bus routes.");
    }

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

//delete a Review
const deleteReview = async (req, res, next) => {
  try {
    const { schoolCode, _id } = req.params;

    // Find the review to be deleted
    const reviewToDelete = await School.findOne(
      { schoolCode },
      { reviews: { $elemMatch: { _id } } }
    );

    if (!reviewToDelete) {
      throw new Error("Review you wanted to delete doesn't exist");
    }

    // Get the rating of the review to be deleted
    const ratingToDelete = reviewToDelete.reviews[0].rating;

    // Delete the review and update noOfReviews
    const updatedSchool = await School.findOneAndUpdate(
      { schoolCode },
      {
        $pull: { reviews: { _id } },
        $inc: { noOfReviews: -1, ratings: -ratingToDelete },
      },
      { new: true }
    );

    if (!updatedSchool) {
      throw new Error(
        "Failed to update school information after deleting review"
      );
    }

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

//delete a FAQ
const deleteFaq = async (req, res, next) => {
  try {
    const { schoolCode, _id } = req.params;

    // Find the faq to be deleted
    const faqToDelete = await School.findOne(
      { schoolCode },
      { faq: { $elemMatch: { _id } } }
    );

    if (!faqToDelete) {
      throw new Error("FAQ you wanted to delete doesn't exist");
    }

    // Delete the review and update noOfReviews
    const updatedSchool = await School.findOneAndUpdate(
      { schoolCode },
      {
        $pull: { faq: { _id } },
      },
      { new: true }
    );

    if (!updatedSchool) {
      throw new Error("Failed to update school information after deleting faq");
    }

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

//Add a New FAQ
const addNewFaq = async (req, res, next) => {
  try {
    const { schoolCode } = req.params;
    const newFaqData = req.body;

    if (!newFaqData.question || !newFaqData.answer) {
      throw new Error("Question and Answer are required");
    }

    const updatedSchool = await School.findOneAndUpdate(
      { schoolCode },
      {
        $push: { faq: newFaqData }, // Add new Faq
      },
      { new: true }
    );

    if (!updatedSchool) {
      throw new Error("School not found or unable to update faq.");
    }

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

// Edit The FAQ
const editFaq = async (req, res, next) => {
  try {
    const { schoolCode, _id } = req.params;
    const newFaqData = req.body;

    if (!newFaqData.question || !newFaqData.answer) {
      throw new Error("Question and Answer are required");
    }

    // Find the school and remove the FAQ with matching _id
    const updatedSchool = await School.findOneAndUpdate(
      { schoolCode, "faq._id": _id },
      { $pull: { faq: { _id } } },
      { new: true }
    );

    if (!updatedSchool) {
      throw new Error("School not found or unable to update FAQ.");
    }

    // Find the updated school by ID and push the new FAQ data
    const updatedSchoolWithNewFaq = await School.findByIdAndUpdate(
      updatedSchool._id,
      { $push: { faq: newFaqData } },
      { new: true }
    );

    if (!updatedSchoolWithNewFaq) {
      throw new Error("Failed to add new FAQ to school.");
    }

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

// Add new others tab ...
const addNewOthersTab = async (req, res, next) => {
  try {
    const { schoolCode } = req.params;
    const newOthersTab = JSON.parse(req.body.others);

    if (!newOthersTab.tName || !newOthersTab.title || !newOthersTab.details) {
      return res.status(400).send({
        success: false,
        status: "All fields are required",
        message: "Make sure all fields are entered correctly",
      });
    }

    const finalData = {
      tName: newOthersTab.tName,
      title: newOthersTab.title,
      details: newOthersTab.details,
      images: [],
    };

    if (req.files && req.files["images"]) {
      for (const file of req.files["images"]) {
        const photo = await photoWork(file);
        const image = {
          blurHash: photo.blurHash,
          secure_url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        finalData.images.push(image);
      }
    }

    const updatedSchool = await School.findOneAndUpdate(
      { schoolCode },
      {
        $push: { others: finalData },
      },
      { new: true }
    );

    // Access the newly created object:
    const createdObject = updatedSchool?.others;

    if (!updatedSchool) {
      throw new Error("School not found or unable to add the tab.");
    }

    req.data = createdObject;

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

//delete Others tab
const deleteOthersTab = async (req, res, next) => {
  try {
    const { schoolCode, _id } = req.params;

    // Get the Tab to be deleted this is for deleting images from image server
    const tabToDelete = await School.findOne(
      { schoolCode },
      { others: { $elemMatch: { _id } } }
    );

    if (!tabToDelete) {
      throw new Error("Tab you wanted to delete doesn't exist");
    }

    const ourImages = tabToDelete.others[0].images;

    ourImages.forEach(async (img) => {
      await cloudinary.uploader.destroy(img.public_id, (error, result) => {
        if (error) {
          return res.status(500).send({
            success: false,
            status: "Tab deletion failed",
            message: `${error.message}`,
          });
        }
      });
    });

    const updatedSchool = await School.findOneAndUpdate(
      { schoolCode },
      { $pull: { others: { _id } } },
      { new: true }
    );

    if (!updatedSchool) {
      throw new Error("Tab Route you wanted to delete doesn't exist");
    }

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

// Update Others Tab
const updateOthersTab = async (req, res, next) => {
  try {
    const { schoolCode, _id } = req.params;
    const newOthersTabData = req.body;

    if (
      !newOthersTabData.tName ||
      !newOthersTabData.title ||
      !newOthersTabData.details
    ) {
      throw new Error("All fields are required");
    }

    delete newOthersTabData.images;
    delete newOthersTabData._id;

    const updatedSchool = await School.findOneAndUpdate(
      {
        schoolCode: schoolCode,
        "others._id": _id,
      },
      {
        $set: {
          "others.$.tName": newOthersTabData.tName,
          "others.$.title": newOthersTabData.title,
          "others.$.details": newOthersTabData.details,
        },
      },
      { new: true }
    ).exec();

    if (!updatedSchool) {
      throw new Error("Failed to update the tab.");
    }

    req.data = updatedSchool.others;

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

// update school
const updateSchool = async (req, res, next) => {
  try {
    const admin = req.staff;

    if (admin.role !== "Administrator") {
      return res.status(401).send({
        success: false,
        status: "School Updation Failed",
        message: "You are not authorized to perform this operation",
      });
    }

    const { schoolCode } = req.params;

    const {
      logo,
      sName,
      name,
      studentsNo,
      address,
      images,
      facilities,
      text1,
      programs,
      principle,
      estd,
      text2,
      phone,
      email,
      social,
      coordinates,
      teamText,
      text3,
      policies,
      studentsTaught,
      leftImages,
    } = JSON.parse(req.body.school);

    const schoolData = {
      logo,
      sName,
      name,
      studentsNo,
      address,
      images,
      facilities,
      text1,
      programs,
      principle,
      estd,
      text2,
      phone,
      email,
      social,
      coordinates,
      teamText,
      text3,
      policies,
      studentsTaught,
    };

    schoolData.images = [];

    if (req.files && req.files["logo"]) {
      for (const file of req.files["logo"]) {
        const photo = await photoWork(file);
        const image = {
          blurHash: photo.blurHash,
          secure_url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        schoolData.logo = image;
      }
    }

    if (req.files && req.files["images"]) {
      for (const file of req.files["images"]) {
        const photo = await photoWork(file);
        const image = {
          blurHash: photo.blurHash,
          secure_url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        schoolData.images.push(image);
      }
    }

    if (leftImages && leftImages.length > 0) {
      leftImages.map((img) => {
        let temp;

        if (schoolData.images[img.index]) {
          temp = schoolData.images[img.index];
        }

        schoolData.images[img.index] = img.image;

        if (temp && temp.secure_url) {
          schoolData.images.push(temp);
        }
      });
    }

    if (req.files && req.files["principlePhoto"]) {
      for (const file of req.files["principlePhoto"]) {
        const photo = await photoWork(file);
        const image = {
          blurHash: photo.blurHash,
          secure_url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        schoolData.principle.image = image;
      }
    }

    const updatedSchool = await School.findOneAndUpdate(
      {
        schoolCode: schoolCode,
      },
      schoolData,
      { new: true }
    );

    if (!updatedSchool) {
      throw new Error("Failed to update the school");
    }

    req.school = updatedSchool;

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

// Start New Session

const startNewSession = async (req, res, next) => {
  try {
    const { schoolCode } = req.params;
    const classesList = JSON.parse(req.query.classesList);
    const year = getDate().year;

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

    const course = school.course2;
    const tempCourse = JSON.parse(JSON.stringify(course));

    if (!school || !course) {
      throw new Error("School or Course not found");
    }

    for (const crc of school.course) {
      const crcIdStr = crc._id.toString();

      if (
        classesList.includes(crcIdStr) &&
        !tempCourse.find((crc2) => crc2.courseId.toString() === crcIdStr)
      ) {
        // Create sections and save them
        const sections = await Promise.all(
          crc.groups.map(async (group) =>
            Promise.all(
              group.sections.map(async (section) => {
                // Create Exam First
                const newExam = new Exam({
                  schoolCode,
                  term: [],
                });
                await newExam.save();

                // Create Exam
                const newSection = new SectionNew({
                  name: section.name,
                  exam: newExam._id,
                  schoolCode,
                  sectionId: section._id.toString(),
                  subjects: section.subjects.map((subject) => ({
                    subject: subject.subject,
                    teacher: subject.teacher._id,
                  })),
                });
                await newSection.save();
                return newSection._id;
              })
            )
          )
        );

        // Create groups and save them
        const groups = await Promise.all(
          crc.groups.map(async (group, index) => {
            const newGroup = new GroupNew({
              schoolCode,
              name: group.name,
              subjects: group.subjects,
              sections: sections[index],
              groupId: group._id.toString(),
            });
            await newGroup.save();
            return newGroup._id;
          })
        );

        // Create course and save it
        const newCourse = new CourseNew({
          schoolCode,
          class: crc.class,
          seatsAvailable: crc.seatsAvailable,
          subjects: crc.subjects,
          groups: groups,
          fees: crc.fees,
          next: crc.next,
          courseId: crc._id.toString(),
        });

        let savedCourse = await newCourse.save();
        school.course2.push(savedCourse._id);
        continue;
      } else if (!classesList.includes(crcIdStr)) {
        continue;
      }

      if (crc.next) {
        let nextClass = JSON.parse(
          JSON.stringify(
            school.course.find(
              (crc2) => crc2._id.toString() === crc.next.toString()
            )
          )
        );

        if (nextClass) {
          nextClass.startDate = getDate().fullDate;
          for (const group1 of tempCourse.find(
            (ccc) => ccc._id.toString() === crc._id.toString()
          ).groups) {
            const correspondingGroup = nextClass.groups.find(
              (group2) =>
                group2.name.toUpperCase() === group1.name.toUpperCase()
            );

            if (!correspondingGroup) {
              throw new Error(
                "Unable to perform the operation !! corresponding group name mismatched"
              );
            }

            for (const section1 of group1.sections) {
              const correspondingSection = correspondingGroup.sections.find(
                (section2) =>
                  section2.name.toUpperCase() === section1.name.toUpperCase()
              );

              if (!correspondingSection) {
                throw new Error(
                  "Unable to perform the operation !! corresponding section name mismatched"
                );
              }

              correspondingSection.students = section1.students.map((std) => {
                const correspondingStudent = section1.students.find(
                  (std2) => std2._id.toString() === std._id.toString()
                );




               let std = {
                courseId: "",
                absentDays: [],
                discount: [],
                fine: [],
                previousLeft: 200,
                paymentHistory: [],
                library: [],
                bus: []
              };

                if (
                  correspondingStudent.bus.length === 0 ||
                  !correspondingStudent.bus[0]?.end
                ) {
                  std.bus.unshift({
                    place: correspondingStudent.bus[0]?.place,
                    start: getDate().fullDate,
                  });
                }

                std.previousLeft = calculateStudentFee(
                  nextClass.fees,
                  school.busFee,
                  correspondingStudent,
                  nextClass.startDate
                );

                const studentInSchool = school.students.find(
                  (student) => student._id.toString() === std._id.toString()
                );
                if (studentInSchool) {
                  studentInSchool.course = {
                    class: nextClass._id,
                    group: correspondingGroup._id,
                    section: correspondingSection._id,
                  };
                }

                return std;
              });
            }
          }

          course.course.find((ctr, index) => {
            if (ctr._id.toString() === nextClass._id.toString()) {
              course.course[index] = nextClass;
            }
          });

          course.course.find((ctr, index) => {
            if (ctr._id.toString() === crc._id.toString()) {
              course.course[index] = crc;
            }
          });
        }
      }

      if (!crc.next) {
        await Promise.all(
          tempCourse.map(async (crc2, index) => {
            if (crc2.courseId.toString() === crc._id.toString()) {
              function extractStudents(a) {
                let studentsArray = a.groups.flatMap((grp) =>
                  grp.sections.flatMap((sec) =>
                    sec.students.map((std) => std.studentId)
                  )
                );

                return studentsArray;
              }

              const allStudents = extractStudents(tempCourse[index]);

              const studentsToDelete = school.students.filter((stu) =>
                allStudents.some(
                  (stu2) => stu2.toString() === stu._id.toString()
                )
              );

              // Push the deleted student to OlderData
              const olderData = await OlderData.findOneAndUpdate(
                { schoolCode, year },
                {
                  $push: {
                    students: { $each: studentsToDelete }, // here studentsToDelete is an array
                    courses: crc2._id, // Directly push the single course ID
                  },
                },
                { new: true, upsert: true }
              );

              // Add olderData ID to School if new
              if (olderData && olderData.isNew) {
                school.olderData.unshift(olderData._id);
              }

              // Remove the students from school.students
              school.students = school.students.filter(
                (stu) =>
                  !allStudents.some(
                    (stu2) => stu2.toString() === stu._id.toString()
                  )
              );

              // Remove the course from school.course2
              school.course2 = school.course2.filter(
                (el) => el._id.toString() !== crc2._id.toString()
              );

              // Create sections and save them
              const sections = await Promise.all(
                crc.groups.map(async (group) =>
                  Promise.all(
                    group.sections.map(async (section) => {
                      // Create Exam First
                      const newExam = new Exam({
                        schoolCode,
                        term: [],
                      });
                      await newExam.save();

                      // Create Exam
                      const newSection = new SectionNew({
                        name: section.name,
                        exam: newExam._id,
                        schoolCode,
                        sectionId: section._id.toString(),
                        subjects: section.subjects.map((subject) => ({
                          subject: subject.subject,
                          teacher: subject.teacher._id,
                        })),
                      });
                      await newSection.save();
                      return newSection._id;
                    })
                  )
                )
              );

              // Create groups and save them
              const groups = await Promise.all(
                crc.groups.map(async (group, index) => {
                  const newGroup = new GroupNew({
                    schoolCode,
                    name: group.name,
                    subjects: group.subjects,
                    sections: sections[index],
                    groupId: group._id.toString(),
                  });
                  await newGroup.save();
                  return newGroup._id;
                })
              );

              // Create course and save it
              const newCourse = new CourseNew({
                schoolCode,
                class: crc.class,
                seatsAvailable: crc.seatsAvailable,
                subjects: crc.subjects,
                groups: groups,
                fees: crc.fees,
                next: crc.next,
                courseId: crc._id.toString(),
              });

              let savedCourse = await newCourse.save();
              school.course2.push(savedCourse._id);
            }
          })
        );
      }
    }

    await school.save();
    next();
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      success: false,
      status: "New Session failed to start",
      message: e.message,
    });
  }
};

// *****************************************************************************
// below here are the optimized code which can be used for our work

// Suspend staff from school
async function suspendStaff(req, res, next) {
  try {
    const { staff: admin } = req;
    const { schoolCode, _id } = req.params;

    if (admin.role !== "Administrator") {
      return res.status(401).send({
        success: false,
        status: "Staff Suspension Failed",
        message: "You are not authorized to suspend the staff",
      });
    }

    // Perform both operations concurrently
    const [staffUpdateResult, schoolUpdateResult] = await Promise.all([
      Staff.updateOne(
        { _id, schoolCode },
        { $set: { status: "removed", tokens: [] } }
      ),
      School.updateOne(
        { schoolCode, "staffs._id": _id },
        { $set: { "staffs.$.removedOn": getDate().fullDate } }
      ),
    ]);

    if (staffUpdateResult.nModified === 0) {
      return res.status(404).send({
        success: false,
        status: "Staff Not Found",
        message: "The staff you are trying to add does not exist",
      });
    }
    next();
  } catch (e) {
    console.error(e);
    return res.status(500).send({
      success: false,
      status: "Staff Suspension Failed",
      message: e.message,
    });
  }
}

// Add staff again to school
async function addStaff(req, res, next) {
  try {
    const { staff: admin } = req;
    const { schoolCode, _id } = req.params;

    if (admin.role !== "Administrator") {
      return res.status(401).send({
        success: false,
        status: "Staff Addition Failed",
        message: "You are not authorized to add the staff",
      });
    }

    if (parseInt(schoolCode) !== admin.schoolCode) {
      throw new Error("SchoolCode mismatch detected");
    }

    // Perform both operations concurrently
    const [staffUpdateResult, schoolUpdateResult] = await Promise.all([
      Staff.updateOne(
        { _id, schoolCode },
        { $set: { status: "active", tokens: [] } }
      ),
      School.updateOne(
        { schoolCode, "staffs._id": _id },
        { $unset: { "staffs.$.removedOn": "" } }
      ),
    ]);

    if (staffUpdateResult.nModified === 0) {
      return res.status(404).send({
        success: false,
        status: "Staff Not Found",
        message: "The staff you are trying to add does not exist",
      });
    }
    next();
  } catch (e) {
    console.error(e);
    return res.status(500).send({
      success: false,
      status: "Staff Addition Failed",
      message: e.message,
    });
  }
}

module.exports = {
  updateCourse,
  updateSchool,
  deleteGallery,
  staffProfileUpdate,
  createNewStaff,
  findSchoolAdmissions,
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

  addExam,
  publishResult,
  getExamInfo,

  createCourse2,
  updateCourseNext,
  startNewSession,
  suspendStaff,
  addStaff,
};
