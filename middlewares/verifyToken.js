const jwt = require("jsonwebtoken");
const Student = require("../schemas/studentSchema");
const Staff = require("../schemas/staffSchema");
const School = require("../schemas/schoolSchema");
const express = require("express");
const app = express();

app.use(express.json());

require("dotenv").config({ path: "../config/config.env" });

// Function to verify the JWT and get the corresponding user protected route

async function verifySchoolStaff(req, res, next) {
  try {
    const schoolCode = parseInt(req.params.schoolCode);

    const secretKey = process.env.JWT_SECRET;
    const token = req.cookies.jwtCookie;

    if (!token) {
      return res.status(403).send({
        success: false,
        status: "Unauthorized",
        message: "Verification failed! Please login and try again",
      });
    }

    const decodedToken = jwt.verify(token, secretKey);

    if (!decodedToken.userId) {
      return res.status(403).send({
        success: false,
        status: "Unauthorizes",
        message: ` You are not authorized to perform this operation `,
      });
    }

    const staff = await Staff.findOne({ _id: decodedToken.userId });

    if (!staff) {
      return res.status(403).send({
        success: false,
        status: "Unauthorized",
        message: "You are not authorized to perform this operation",
      });
    }

    if (staff.status === "removed") {
      staff.tokens = [];
      await staff.save();
      return res.status(401).send({
        success: false,
        status: "Not authorized for the operation",
        message:
          "You have been removed from school so please contact school administrator for more info",
      });
    }

    if (staff.schoolCode !== schoolCode) {
      return res.status(403).send({
        success: false,
        status: "Authorization Failed",
        message: ` You are logged in from another school account. `,
      });
    }

    let verify = false;

    staff.tokens.forEach((tokenObject) => {
      if (tokenObject.token.includes(token)) {
        verify = true;
      }
    });

    if (!verify) {
      res.cookie("jwtCookie", token, {
        httpOnly: true,
        maxAge: 0,
      });

      res.cookie("user", "Staff", {
        httpOnly: true,
        maxAge: 0,
      });

      return res.status(403).send({
        success: false,
        status: "Unauthorizes",
        message: ` You are not authorized to perform this operation `,
      });
    }
    req.staff = staff;
    req.token = token;
    next();
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      success: false,
      status: "Opeartion Failed!",
      message: e.message,
    });
  }
}

async function verifySchoolStudent(req, res, next) {
  try {
    const schoolCode = req.params.schoolCode;
    const secretKey = process.env.JWT_SECRET;
    let studentIncluded;

    const token = req.cookies.jwtCookie;

    if (!token) {
      return res.status(401).send({
        success: false,
        status: `Student verification failed`,
        message: `Verification failed! Please login and try again..`,
      });
    }
    const decodedToken = jwt.verify(token, secretKey);

    if (!decodedToken.userId) {
      return res.status(401).send({
        success: false,
        status: `Student verification failed`,
        message: `Verification failed! Please login and try again..`,
      });
    }

    const student = await Student.findOne({ _id: decodedToken.userId });

    if (!student) {
      return res.status(401).send({
        success: false,
        status: `Student verification failed`,
        message: `Verification failed! Please login and try again..`,
      });
    }

    if (student.schoolCode != schoolCode) {
      studentIncluded = true;
    }

    if (!studentIncluded) {
      return res.status(403).send({
        success: false,
        status: `Student verification failed`,
        message: ` You are logged in from another school account. `,
      });
    }

    let verify = false;

    student.tokens.forEach((tokenObject) => {
      if (tokenObject.token.includes(token)) {
        verify = true;
      }
    });

    if (!verify) {
      res.cookie("jwtCookie", token, {
        httpOnly: true,
        maxAge: 0,
      });

      res.cookie("user", "Student", {
        httpOnly: true,
        maxAge: 0,
      });

      return res.status(401).send({
        success: false,
        status: `Student verification failed`,
        message: `Verification failed! Please login and try again..`,
      });
    }

    req.student = student;
    req.token = token;
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).redirect("/login");
  }
}

async function getStudentFromToken(req, res) {
  try {
    const secretKey = process.env.JWT_SECRET;

    const token = req.cookies.jwtCookie;

    if (!token) {
      return res.status(401).send({
        success: false,
        status: `Student Details Failed to get`,
        message: `Token is not available..`,
      });
    }
    const decodedToken = jwt.verify(token, secretKey);

    if (!decodedToken.userId) {
      return res.status(401).send({
        success: false,
        status: `Student verification failed`,
        message: `Verification failed! Please login and try again..`,
      });
    }

    const student = await Student.findOne({ _id: decodedToken.userId });

    if (!student) {
      res.cookie("jwtCookie", token, {
        httpOnly: true,
        maxAge: 0,
      });

      res.cookie("user", "Student", {
        httpOnly: true,
        maxAge: 0,
      });

      res.status(401).send({
        success: false,
        status: `Student verification failed`,
        message: `Verification failed! Please login and try again..`,
      });

      return false;
    }

    let verify = false;

    student.tokens.forEach((tokenObject) => {
      if (tokenObject.token.includes(token)) {
        verify = true;
      }
    });

    if (!verify) {
      res.cookie("jwtCookie", token, {
        httpOnly: true,
        maxAge: 0,
      });

      res.cookie("user", "Student", {
        httpOnly: true,
        maxAge: 0,
      });

      res.status(401).send({
        success: false,
        status: `Student verification failed`,
        message: `Verification failed! Please login and try again..`,
      });

      return false;
    }

    return student;
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      success: false,
      status: `Student verification failed`,
      message: `Verification failed! Please login and try again..`,
    });
  }
}

async function getStaffFromToken(req, res) {
  try {
    const secretKey = process.env.JWT_SECRET;

    const token = req.cookies.jwtCookie;

    if (!token) {
      return res.status(401).send({
        success: false,
        status: `Staff Details Failed to get`,
        message: `Token is not available..`,
      });
    }

    const decodedToken = jwt.verify(token, secretKey);

    if (!decodedToken.userId) {
      return res.status(401).send({
        success: false,
        status: `Staff verification failed`,
        message: `Verification failed! Please login and try again..`,
      });
    }

    const staff = await Staff.findOne({ _id: decodedToken.userId });

    if (!staff) {
      res.cookie("jwtCookie", token, {
        httpOnly: true,
        maxAge: 0,
      });

      res.cookie("user", "Staff", {
        httpOnly: true,
        maxAge: 0,
      });

      res.status(401).send({
        success: false,
        status: `Staff verification failed`,
        message: `Verification failed! Please login and try again..`,
      });

      return false;
    }

    let verify = false;

    staff.tokens.forEach((tokenObject) => {
      if (tokenObject.token.includes(token)) {
        verify = true;
      }
    });

    if (!verify) {
      res.cookie("jwtCookie", token, {
        httpOnly: true,
        maxAge: 0,
      });

      res.cookie("user", "Staff", {
        httpOnly: true,
        maxAge: 0,
      });

      res.status(401).send({
        success: false,
        status: `Staff verification failed`,
        message: `Verification failed! Please login and try again..`,
      });

      return false;
    }

    return staff;
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      success: false,
      status: `Staff verification failed`,
      message: `Verification failed! Please login and try again..`,
    });
  }
}

module.exports = {
  verifySchoolStaff,
  verifySchoolStudent,
  getStaffFromToken,
  getStudentFromToken,
};
