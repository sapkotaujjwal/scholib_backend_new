const express = require("express");
const router = express.Router();
const upload = require("../config/multer");

//usage
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const {
  changePassword,
  deviceLogoutController,
  generateOtp,
  changePasswordFromOtp,
  verifyOtp,
} = require("../controllers/mutualController");
const {
  loginController,
  logoutController,
  loginController2,
} = require("../controllers/loginController");
const { getDate } = require("../config/nepaliDate");

//middlewares
router.use(express.json());
router.use(cookieParser());
router.use(bodyParser.urlencoded({ extended: true }));

//login to school
router.post("/login", loginController, (req, res) => {
  res.status(200).send({
    success: true,
    user: req.user,
    date: getDate().fullDate,
  });
});

// login via token
router.get("/login2", loginController2, (req, res) => {
  res.status(200).send({
    success: true,
    data: req.user,
    date: getDate().fullDate,
  });
});

//LogOut
router.get("/logout/:schoolCode", logoutController, (req, res) => {
  res.cookie("jwtCookie", "token", {
    httpOnly: true,
    maxAge: 0,
    secure: true,
    sameSite: "None",
  });
  res.cookie("user", "Student", {
    httpOnly: true,
    maxAge: 0,
    secure: true,
    sameSite: "None",
  });

  res.status(200).send({
    success: true,
    message: "Logout Successful!",
  });
});

//change password
router.post(
  "/security/:schoolCode/change/password",
  changePassword,
  (req, res) => {
    res.status(200).send({
      success: true,
      message: "Password updated successfully",
    });
  }
);

// logOut a specific Device
router.delete(
  "/logout/:schoolCode/:_id",
  deviceLogoutController,
  (req, res) => {
    res.status(200).send({
      success: true,
      status: "Device Logout Successful!",
    });
  }
);

// Generate Otp
router.get("/generate/otp", generateOtp, (req, res) => {
  res.cookie("jwtCookie", "token", {
    httpOnly: true,
    maxAge: 0,
    secure: true,
    sameSite: "None",
  });
  res.cookie("user", "Student", {
    httpOnly: true,
    maxAge: 0,
    secure: true,
    sameSite: "None",
  });

  res.status(200).send({
    success: true,
    status: "Successful",
    message: "OTP Sent Successfully",
  });
});

// verify your password
router.get("/verify/otp", verifyOtp, (req, res) => {
  res.status(200).send({
    success: true,
    status: "Successful",
    message: "You can now set a new password",
  });
});

// change your password
router.get("/change/passwordfromOtp", changePasswordFromOtp, (req, res) => {
    res.status(200).send({
      success: true,
      status: "Password Updated",
      message: "Now you can proceed to login",
    });
  });

module.exports = router;
