const jwt = require("jsonwebtoken");
const Student = require("../schemas/studentSchema");
const Staff = require("../schemas/staffSchema");
const express = require("express");
const app = express();

//usage
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

require("dotenv").config({ path: "../config/config.env" });

async function generateTokenStudent(req, res, next) {
  try {
    const user = req.user;
    const secretKey = process.env.JWT_SECRET;
    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "30d",
    });

    res.cookie("jwtCookie", token, {
      httpOnly: true,
      // domain: process.env.DOMAIN,
      maxAge: 2592000000,

      // domain: process.env.DOMAIN,
      sameSite: "None",
      secure: true,
    });

    res.cookie("user", "Student", {
      httpOnly: true,
      // domain: process.env.DOMAIN,
      maxAge: 2592000000,
      sameSite: "None",
      secure: true,
    });

    const device = req.headers["user-agent"];
    tokenObject = {
      device,
      token,
    };
    user.tokens.unshift(tokenObject);
    req.user = await Student.findOneAndUpdate({ _id: user._id }, user, {
      new: true,
    });

    if(next){
      next();
    }


    // next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Token generation failed",
      message: e.message,
    });
  }
}

async function generateTokenStaff(req, res, next) {
  try {
    const user = req.user;
    const secretKey = process.env.JWT_SECRET;
    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "10h",
    });
    res.cookie("jwtCookie", token, {
      httpOnly: true,
      // domain: process.env.DOMAIN,
      sameSite: "None",
      secure: true,
      maxAge: 36000000, // Cookie expiration time (10 hrs)
    });
    res.cookie("user", "Staff", {
      httpOnly: true,
      // domain: process.env.DOMAIN,
      sameSite: "None",
      secure: true,
      maxAge: 36000000, // Cookie expiration time (10 hrs)
    });
    const device = req.headers["user-agent"];
    tokenObject = {
      device,
      token,
    };
    user.tokens.unshift(tokenObject);
    req.user = await Staff.findOneAndUpdate({ _id: user._id }, user, {
      new: true,
    });

    if(next){
      next();
    }


    // next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: "Token generation failed",
      message: e.message,
    });
  }
}

module.exports = { generateTokenStudent, generateTokenStaff };
