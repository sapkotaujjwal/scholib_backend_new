const { School } = require("../schemas/schoolSchema");
const Student = require("../schemas/studentSchema");
const { photoWork } = require("../config/photoWork");
const { CourseNew } = require("../schemas/courseSchema");

const Gallery = require("../schemas/gallerySchema");
const Update = require("../schemas/updateSchema");
const { verifyStaff, verifyStudent } = require("../middlewares/verifyToken2");

// find school home
const findSchoolHome = async (req, res, next) => {
  try {
    const schoolCode = req.params.schoolCode;

    const school = await School.findOne({ schoolCode });
    if (!school) {
      return res.status(404).send({
        success: false,
        status: "School not found",
        message: ` The school you are looking for isn't found. Try checking your schoolCode `,
      });
    }

    school.students = [];
    school.admissions = [];

    req.school = school;

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

// find school gallery
const findSchoolGallery = async (req, res, next) => {
  try {
    const schoolCode = req.params.schoolCode;
    let gallery = await Gallery.findOne({ schoolCode });
    gallery = gallery.gallery;

    if (!gallery) {
      return res
        .status(404)
        .send("Gallery you are searching for doesn't exists");
    }

    const index = parseInt(req.query.from);
    indexEnd = index + 12;

    const categories = req.query.categories;

    const matchingItems = [];

    if (categories !== "all") {
      for (const item of gallery) {
        if (item.categories.some((category) => categories.includes(category))) {
          matchingItems.push(item);
        }
      }

      req.gallery = matchingItems.slice(index, indexEnd);
      req.totalCount = matchingItems.length;
    } else {
      req.gallery = gallery.slice(index, indexEnd);
      req.totalCount = gallery.length;
    }

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

//find school courses
const findSchoolCourses = async (req, res, next) => {
  try {
    const schoolCode = parseInt(req.params.schoolCode);
    // const courses = await School.findOne({schoolCode}).populate({
    //   path: "course",
    //   populate: {
    //     path: "groups",
    //     populate: {
    //       path: "sections",
    //       select: "-students -exams",
    //     },
    //   },
    // });

    const courses = await School.findOne({ schoolCode }).populate({
      path: "course2",
      populate: {
        path: "groups",
        populate: {
          path: "sections",
          select: "-students",
        },
      },
    });

    req.courses = {
      course: courses.course2,
    };
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

//find school updates
const findSchoolUpdates = async (req, res, next) => {
  try {
    const schoolCode = req.params.schoolCode;
    const token = req.cookies.jwtCookie;
    let user = req.cookies.user;
    let member;

    if (user === "Student" && token) {
      try {
        member = await verifyStudent(schoolCode, token);

        if (!member) {
          user = "";
        }
      } catch (error) {
        console.log(error);
      }
    }

    if (user === "Staff" && token) {
      try {
        member = await verifyStaff(schoolCode, token);
        if (!member) {
          user = "";
        }
      } catch (error) {
        console.error(error);
      }
    }

    let update = await Update.findOne({ schoolCode });
    if (!update) {
      return res.status(404).send({
        success: false,
        status: "Update not found",
        message: `Update for school Code ${schoolCode} doesn't exists`,
      });
    }

    update = update.update;

    const filteredUpdate = update.filter((upd) => {
      if (user === "Student") {
        return upd.showTo !== "Staffs";
      } else if (user === "Staff") {
        return upd;
      } else {
        return upd.showTo !== "Staffs" && upd.showTo !== "Members";
      }
    });

    let index = parseInt(req.query.from);
    if (!index) {
      index = 0;
    }
    indexEnd = index + 20;

    const newData = filteredUpdate.slice(index, indexEnd);
    req.updates = newData;
    next();
  } catch (e) {
    console.log(e);
    res.status(500).send({
      success: false,
      status: "Something went wrong",
      message: e.message,
    });
  }
};

//students admission
const schoolAdmission = async (req, res, next) => {
  try {
    const schoolCode = req.params.schoolCode;
    const school = await School.findOne({ schoolCode: schoolCode });

    if (!school) {
      return res.status(404).send({
        success: false,
        status: "School not found",
        message: "The school you are looking for doesn't exists",
      });
    }

    const studentData = JSON.parse(req.body.student);

    const bus = studentData.bus;

    //some checkups

    studentData.schoolCode = schoolCode;
    delete studentData.status;
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
      return obj._id.toString() === bus;
    });

    if (busPlace && busPlace.loaction) {
      busPlace.status = true;
    }

    if (busPlace && busPlace.location) {
      studentData.bus = busPlace;
    }

    const newStudent = new Student(studentData);
    const createdStudent = await newStudent.save();

    school.admissions.push(createdStudent);

    // Save the updated school
    await school.save();
    next();
  } catch (e) {
    console.log(e);
    res.status(500).send({
      success: false,
      status: "Student Admission Failed",
      message: e.message,
    });
  }
};

// Add a School Review
const addReview = async (req, res, next) => {
  try {
    const schoolCode = req.params.schoolCode;
    const school = await School.findOne({ schoolCode: schoolCode });

    if (!school) {
      return res.status(404).send({
        success: false,
        status: "School not found",
        message: "The school you are looking for doesn't exists",
      });
    }

    const review = req.body;

    const user = req.cookies.user;
    const token = req.cookies.jwtCookie;

    if (!user || !token) {
      return res.status(401).send({
        success: false,
        status: "Review failed to add",
        message: "You are not authorized to add review",
      });
    }

    if (user === "Staff") {
      let result = await verifyStaff(schoolCode, token);

      if (!result) {
        return res.status(401).send({
          success: false,
          status: "Review failed to add",
          message: "Only school members can add review",
        });
      }
      review._id = result._id;
      review.name = result.name;
    }

    if (user === "Student") {
      let result = await verifyStudent(schoolCode, token);

      if (!result) {
        return res.status(401).send({
          success: false,
          status: "Review failed to add",
          message: "Only school members can add review",
        });
      }

      review._id = result._id;
      review.name = result.name;
    }

    let rev;

    for (let i = 0; i < school.reviews.length; i++) {
      rev = school.reviews[i];

      if (rev._id === review._id.toString()) {
        school.noOfReviews--;
        school.ratings = school.ratings - rev.rating;
        school.reviews.splice(i, 1);
        break;
      }
    }

    school.reviews.unshift(review);
    school.noOfReviews++;
    school.ratings = school.ratings + review.rating;

    // Save the updated school
    await school.save();
    next();
  } catch (e) {
    console.log(e);
    res.status(500).send({
      success: false,
      status: "Review failed to add",
      message: e.message,
    });
  }
};

module.exports = {
  findSchoolHome,
  findSchoolGallery,
  findSchoolUpdates,
  schoolAdmission,
  findSchoolCourses,
  addReview,
};
