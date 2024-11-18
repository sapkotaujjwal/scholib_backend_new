const Gallery = require("../schemas/gallerySchema");
const { photoWork, deleteImage } = require("../config/photoWork");
const Update = require("../schemas/updateSchema");
const { getCurrentNepaliDate } = require("../config/nepaliDate");
const Student = require("../schemas/studentSchema");
const { School, OlderData } = require("../schemas/schoolSchema");
const Staff = require("../schemas/staffSchema");
const Exam = require("../schemas/examSchema");
const { SectionNew } = require("../schemas/courseSchema");

const createGallery = async (req, res, next) => {
  try {
    const schoolCode = req.params.schoolCode;
    const gallery = await Gallery.findOne({ schoolCode });
    if (!gallery) {
      return res.status(404).send({
        success: false,
        status: "Not found",
        message: `Gallery schema for school code ${schoolCode} isn't found`,
      });
    }

    for (const file of req.files["photo"]) {
      const photo = await photoWork(file);
      const newImage = {
        image: {
          blurHash: photo.blurHash,
          secure_url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        },
        categories: req.body.categories.split(","),
      };
      gallery.gallery.unshift(newImage);
    }

    await gallery.save();
    next();
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      success: false,
      status: "Image upload failed",
      message: e.message,
    });
  }
};

const createUpdate = async (req, res, next) => {
  try {
    const schoolCode = req.params.schoolCode;
    const update = await Update.findOne({ schoolCode });

    if (!update) {
      return res.status(404).send({
        success: false,
        status: "Not found",
        message: `Update schema for school code ${schoolCode} isn't found`,
      });
    }

    const time = await getCurrentNepaliDate();

    const newUpdate = {
      title: req.body.title,
      showTo: req.body.showTo,
      author: {
        _id: req.staff._id,
        name: req.staff.name,
        title: req.staff.title,
      },
      images: [],
      time: time.nepaliTime,
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
        newUpdate.images.push(image);
      }
    }
    update.update.unshift(newUpdate);
    await update.save();
    next();
  } catch (e) {
    console.error(e);
    return res.status(500).send({
      success: false,
      status: "Update creation failed",
      message: e.message,
    });
  }
};

async function deleteUpdate(req, res, next) {
  try {
    const { schoolCode, _id } = req.params;
    const update = await Update.findOne({ schoolCode });

    if (!update) {
      return res.status(404).send({
        success: false,
        status: "Not found",
        message: `Update schema for school code ${schoolCode} isn't found`,
      });
    }

    const filteredObject = update.update.find((obj) => obj._id.equals(_id));

    if (
      req.staff.role !== "Administrator" &&
      req.staff.role !== "Coordinator" &&
      filteredObject.author._id.toString() !== req.staff._id.toString()
    ) {
      return res.status(403).send({
        success: false,
        status: "Update deletion failed",
        message: "You are not authorized to delete the update",
      });
    }

    filteredObject.images.forEach(async (img) => {
      await deleteImage(img.public_id);
    });

    update.update = update.update.filter((obj) => obj._id != _id);
    await update.save();
    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Update deletion failed",
      message: e.message,
    });
  }
}

const editUpdate = async (req, res, next) => {
  try {
    const { schoolCode, _id } = req.params;
    const update = await Update.findOne({ schoolCode });

    const { title, showTo } = req.body;

    if (!update) {
      return res.status(404).send({
        success: false,
        status: "Not found",
        message: `Update schema for school code ${schoolCode} isn't found`,
      });
    }

    const filteredObject = update.update.find((obj) => obj._id.equals(_id));

    if (
      req.staff.role !== "Administrator" &&
      req.staff.role !== "Coordinator" &&
      filteredObject.author._id.toString() !== req.staff._id.toString()
    ) {
      return res.status(403).send({
        success: false,
        status: "Update failed to edit",
        message: "You are not authorized to edit the update",
      });
    }

    const time = await getCurrentNepaliDate();
    const date = await getCurrentNepaliDate();
    filteredObject.title = title;
    filteredObject.showTo = showTo;
    filteredObject.time = time.nepaliTime;
    filteredObject.date = date.nepaliDate;
    filteredObject.author = {
      _id: req.staff._id,
      name: req.staff.name,
      title: req.staff.title,
    };

    update.update = update.update.filter((obj) => obj._id != _id);

    update.update.unshift(filteredObject);
    await update.save();
    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Update failed to edit",
      message: e.message,
    });
  }
};

async function staffUpdate(req, res, next) {
  try {
    const staff = req.staff;
    const data = JSON.parse(req.body.staff);
    const { schoolCode } = req.params;

    if (staff._id.toString() !== data._id) {
      return res.status(401).send({
        success: false,
        status: "Profile Updation Failed",
        message: "something is wrong with the request",
      });
    }

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

    delete data.status;
    delete data.loginId;
    delete data.schoolCode;
    delete data.password;
    delete data.role;
    delete data.salary;
    delete data.paymentHistory;
    delete data.absentDays;
    delete data.tokens;

    const updatedDoc = await Staff.findByIdAndUpdate({ _id: data._id }, data, {
      new: true,
    });

    const updatedSchool = await School.findOneAndUpdate(
      { schoolCode, "staffs._id": data._id },
      { $set: { "staffs.$": updatedDoc } },
      { new: true }
    );

    req.staff = updatedDoc;
    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Profile updation failed`,
      message: e.message,
    });
  }
}

// here this one is messy i don't know what is happening here
async function studentsAttendance(req, res, next) {
  try {
    const staff = req.staff;
    const data = req.body;

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

    delete data.status;
    delete data.loginId;
    delete data.password;
    delete data.role;
    delete data.salary;
    delete data.paymentHistory;
    delete data.absentDays;
    delete data.tokens;

    staff.set(data);

    req.staff = await staff.save();

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Password updation failed`,
      message: e.message,
    });
  }
}

// get a particular student
async function getStudent(req, res, next) {
  try {
    const { schoolCode, _id } = req.params;

    const student1 = await Student.findOne({ _id });

    if (!student1) {
      return res.status(404).send({
        success: false,
        status: `Student failed to get`,
        message: "Student does not exists",
      });
    }

    const student = { ...student1.toObject() };

    delete student.tokens;
    delete student.password;

    if (student.schoolCode === parseInt(schoolCode)) {
      req.student = student;
    } else {
      return res.status(401).send({
        success: false,
        status: `Student failed to get`,
        message: "You are not authorized to get this student",
      });
    }

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Student failed to get`,
      message: e.message,
    });
  }
}

// get a particular staff
async function getStaff(req, res, next) {
  try {
    const { schoolCode, _id } = req.params;

    const staff1 = await Staff.findOne({ _id });

    if (!staff1) {
      return res.status(404).send({
        success: false,
        status: `Staff failed to get`,
        message: "Staff does not exists",
      });
    }

    const staff = { ...staff1.toObject() };

    delete staff.tokens;
    delete staff.password;

    if (staff.schoolCode === parseInt(schoolCode)) {
      req.staff = staff;
    } else {
      return res.status(401).send({
        success: false,
        status: `Staff failed to get`,
        message: "You are not authorized to get this student",
      });
    }

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Student failed to get`,
      message: e.message,
    });
  }
}

// get all students
async function getAllStudents(req, res, next) {
  try {
    const { schoolCode } = req.params;
    const year = req.query.year || null;

    if (!year) {
      const school = await School.findOne({ schoolCode });
      if (!school) {
        return res.status(404).send({
          success: false,
          status: `School Not Found`,
          message: "The school you are looking for does not exists",
        });
      }

      req.student = school.students;
    } else {
      const olderData = await OlderData.findOne({ schoolCode, year });
      req.student = olderData.students;
    }

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Student failed to get`,
      message: e.message,
    });
  }
}

// get all staffs
async function getAllStaffs(req, res, next) {
  try {
    const { schoolCode } = req.params;

    const school = await School.findOne({ schoolCode }, { staffs: 1 });

    if (!school) {
      return res.status(404).send({
        success: false,
        status: `School Not Found`,
        message: "The school you are looking for does not exist",
      });
    }

    const staffIds = school.staffs
      .filter((ind) => !ind.removedOn)
      .map((ind) => ind._id);

    const allStaffs = await Staff.find({
      _id: { $in: staffIds },
      schoolCode: parseInt(schoolCode),
    }).select("-password -tokens -loginId");

    req.staffs = allStaffs;
    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Failed to get staff`,
      message: e.message,
    });
  }
}

// update exam Marks
async function updateExamMarks(req, res, next) {
  try {
    const { schoolCode } = req.params;
    const mainData = req.body;

    const section = await SectionNew.findOne({
      schoolCode,
      _id: mainData.section,
    });

    if (
      req.staff.role !== "Administrator" &&
      req.staff.role !== "Coordinator" &&
      req.staff.role !== "Moderator" &&
      selectedSubject.teacher._id.toString() !== req.staff._id.toString()
    ) {
      throw new Error("You are not allowed to perform this operation");
    }

    await Exam.findOneAndUpdate(
      {
        schoolCode: schoolCode,
        _id: section.exam,
        [`term.${mainData.term}.subjects._id`]: mainData.data._id,
      },
      {
        $set: {
          [`term.${mainData.term}.subjects.$`]: mainData.data,
        },
      }
    );

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Failed to update marks`,
      message: e.message,
    });
  }
}

module.exports = {
  createGallery,
  deleteUpdate,
  editUpdate,
  createUpdate,
  staffUpdate,
  studentsAttendance,
  getStudent,
  getAllStudents,
  getAllStaffs,
  getStaff,
  updateExamMarks,
};
