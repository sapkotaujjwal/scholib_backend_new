const Staff = require("../schemas/staffSchema");
const Student = require("../schemas/studentSchema");
const bcrypt = require("bcrypt");
const { verifyStaff, verifyStudent } = require("../middlewares/verifyToken2");
const {
  generateTokenStaff,
  generateTokenStudent,
} = require("../middlewares/jwt");
const { sendMail } = require("../config/sendEmail");

require("dotenv").config({ path: "../config/config.env" });

//change password
async function changePassword(req, res, next) {
  try {
    const { schoolCode } = req.params;
    const user = req.cookies.user;
    const token = req.cookies.jwtCookie;
    let user1;

    if (user === "Student") {
      user1 = await verifyStudent(schoolCode, token);
    }

    if (user === "Staff") {
      user1 = await verifyStaff(schoolCode, token);
    }

    if (!user1) {
      res.cookie("jwtCookie", token, {
        domain: process.env.DOMAIN,
        maxAge: 0,
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
      res.cookie("user", "Staff", {
        domain: process.env.DOMAIN,
        maxAge: 0,
        httpOnly: false,
        sameSite: "None",
        secure: true,
      });

      res.cookie("name", req.user.name, {
        domain: process.env.DOMAIN,
        maxAge: 0,
        httpOnly: false,
        sameSite: "None",
        secure: true,
      });

      res.cookie("role", req.user.role, {
        domain: process.env.DOMAIN,
        maxAge: 0,
        httpOnly: false,
        sameSite: "None",
        secure: true,
      });
    }

    user1.tokens = [];
    req.user = user1;

    const { oldPassword, newPassword } = req.body;

    const hashedPassword = user1.password;
    const passwordMatch = await bcrypt.compare(oldPassword, hashedPassword);

    if (passwordMatch) {
      user1.password = newPassword;
      await user1.save();

      if (user === "Student") {
        await generateTokenStudent(req, res);
      } else {
        await generateTokenStaff(req, res);
      }
    } else {
      return res.status(409).json({
        success: false,
        status: "Password updation failed",
        message: "Incorrect old password",
      });
    }

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Password updation failed`,
      message: e.message,
    });
  }
}

//delete a specific device
async function deviceLogoutController(req, res, next) {
  try {
    const { schoolCode, _id } = req.params;
    const user = req.cookies.user;
    const token = req.cookies.jwtCookie;

    let user1;

    if (user === "Student") {
      user1 = await verifyStudent(schoolCode, token);
    }

    if (user === "Staff") {
      user1 = await verifyStaff(schoolCode, token);
    }

    if (!user1) {
      res.cookie("jwtCookie", "token", {
        httpOnly: true,
        maxAge: 0,
      });
      res.cookie("user", "Student", {
        httpOnly: true,
        maxAge: 0,
      });

      return res.status(403).send({
        success: false,
        status: "Verification failed",
        message: "Your token is invalid!!",
      });
    }

    const newTokens = user1.tokens.filter(
      (token) => token._id.toString() !== _id
    );

    if (user === "Student") {
      await Student.findOneAndUpdate(
        { _id: user1._id.toString() },
        { $set: { tokens: newTokens } },
        { new: true }
      ).exec(); // Added .exec() to execute the query
    } else if (user === "Staff") {
      await Staff.findOneAndUpdate(
        { _id: user1._id.toString() },
        { $set: { tokens: newTokens } },
        { new: true }
      ).exec(); // Added .exec() to execute the query
    }

    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Password updation failed`,
      message: e.message,
    });
  }
}

//Generate OTP
async function generateOtp(req, res, next) {
  try {
    const schoolCode = parseInt(req.query.schoolCode);
    const loginId = parseInt(req.query.loginId);
    const role = req.query.role;

    let user;

    if (role === "Staff") {
      user = await Staff.findOne({ schoolCode, loginId });
    }

    if (role === "Student") {
      user = await Student.findOne({ schoolCode, loginId });
    }

    if (!user) {
      throw new Error(`${role} with login Id: ${loginId} not found`);
    }

    function generateOTP() {
      const characters = "0123456789abcdefghijklmnopqrstuvwxyz";
      let otp = "";
      for (let i = 0; i < 6; i++) {
        otp += characters[Math.floor(Math.random() * characters.length)];
      }
      return otp;
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    user.otp = {
      otp,
      expiresAt,
      count: 0,
    };

    const mailOptions = {
      from: process.env.EMAIL_ID1,
      to: user.email,
      subject: "Reset your password || OTP",
      html: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Your One-Time Password (OTP)</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding: 20px 0;
                background-color: #007bff;
                color: #ffffff;
                border-radius: 8px 8px 0 0;
            }
            .content {
                padding: 20px;
            }
            .otp {
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
                color: #333333;
            }
            .footer {
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #999999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Your One-Time Password (OTP)</h1>
            </div>
            <div class="content">
                <p>Dear ${user.name},</p>
                <p>We have received a request to securely access your school account. For verification purposes, please use the following One-Time Password (OTP):</p>
                <div class="otp">${otp}</div>
                <p>This OTP is valid for the next 3 minutes. Please ensure you do not share this OTP with anyone to keep your account secure.</p>
                <p>Thank you for using our service.</p>
                <p>Best regards,<br>Scholib.com</p>
            </div>
            <div class="footer">
                <p> Scholib Tech Pvt. Ltd </p>
                <p> " Making the digital world available and accessible to all " </p>
            </div>
        </div>
    </body>
    </html>
      `,
    };

    sendMail(mailOptions);
    await user.save();

    next();
  } catch (e) {
    console.log(e);

    return res.status(500).send({
      success: false,
      status: `OTP failed to send`,
      message: e.message,
    });
  }
}

//Verify OTP
async function verifyOtp(req, res, next) {
  try {
    const schoolCode = parseInt(req.query.schoolCode);
    const loginId = parseInt(req.query.loginId);
    const role = req.query.role;
    const otp = req.query.otp;

    let user;

    if (role === "Staff") {
      user = await Staff.findOne({ schoolCode, loginId });
    }

    if (role === "Student") {
      user = await Student.findOne({ schoolCode, loginId });
    }

    if (!user) {
      throw new Error(`${role} with login Id : ${loginId} not found`);
    }

    if (user.otp.count >= 4) {
      delete user.otp;
      await user.save();
      return res.status(401).send({
        success: false,
        status: "OTP Expired",
        message: "You already tried more than 3 times",
      });
    }

    if (user.otp.otp === otp && new Date() < user.otp.expiresAt) {
      user.otp.expiresAt = new Date(Date.now() + 2 * 60 * 1000);
      user.otp.count++;
    } else {
      user.otp.count++;
      await user.save();

      return res.status(401).send({
        success: false,
        status: "Wrong OTP",
        message: `You have ${4 - user.otp.count} attempts left`,
      });
    }

    await user.save();
    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `OTP verification failed`,
      message: e.message,
    });
  }
}

// change password from top
async function changePasswordFromOtp(req, res, next) {
  try {
    const schoolCode = parseInt(req.query.schoolCode);
    const loginId = parseInt(req.query.loginId);
    const role = req.query.role;
    const otp = req.query.otp;
    const password = req.query.password;

    let user;

    if (role === "Staff") {
      user = await Staff.findOne({ schoolCode, loginId });
    }

    if (role === "Student") {
      user = await Student.findOne({ schoolCode, loginId });
    }

    if (!user) {
      throw new Error(`${role} with login Id : ${loginId} not found`);
    }

    if (user.otp.count >= 5) {
      delete user.otp;
      await user.save();
      return res.status(401).send({
        success: false,
        status: "OTP Expired",
        message: "You already tried more than 3 times",
      });
    }

    if (user.otp.otp === otp && new Date() < user.otp.expiresAt) {
      user.password = password;
      user.tokens = [];

      user.otp = {};
    } else {
      user.otp.count++;
      await user.save();

      return res.status(401).send({
        success: false,
        status: "Wrong OTP",
        message: `You have ${3 - user.otp.count} attempts left`,
      });
    }

    await user.save();
    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Password failed to update`,
      message: e.message,
    });
  }
}

module.exports = {
  changePassword,
  deviceLogoutController,
  generateOtp,
  verifyOtp,
  changePasswordFromOtp,
};
