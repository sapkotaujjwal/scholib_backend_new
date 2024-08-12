const jwt = require("jsonwebtoken");
const Student = require("../schemas/studentSchema");
const Staff = require("../schemas/staffSchema");
require("dotenv").config({ path: "../config/config.env" });

// Verify staff
async function verifyStaff(schoolCode, token) {
  try {
    schoolCode = parseInt(schoolCode);

    const secretKey = process.env.JWT_SECRET;
    const decodedToken = jwt.verify(token, secretKey);

    if (!decodedToken.userId) {
      return null;
    }

    const staff = await Staff.findOne({ _id: decodedToken.userId });

    if (!staff) {
      return null;
    }

    if(staff.status === 'removed'){
      staff.tokens = [];
      await staff.save();
      return null;
    }

    if (staff.schoolCode !== schoolCode) {
      return null;
    }


    staff.tokens.forEach((tokenObject) => {
      if (!tokenObject.token.includes(token)) {
        return null;
      }
    });


    return staff;
  } catch (e) {
    console.error(e);
    return new Error(e);
  }
}

// Verify student
async function verifyStudent(schoolCode, token) {
  try {
    const secretKey = process.env.JWT_SECRET;
    const decodedToken = jwt.verify(token, secretKey);

    schoolCode = parseInt(schoolCode);

    if (!decodedToken.userId) {
      return null;
    }

    const student = await Student.findOne({ _id: decodedToken.userId });

    if (!student) {
      return null;
    }

    if (student.schoolCode !== schoolCode) {
      return null;
    }

    return student;
  } catch (e) {
    console.error(e);
    return new Error(e);
  }
}

module.exports = { verifyStaff, verifyStudent };
