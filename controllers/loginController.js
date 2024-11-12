const bcrypt = require("bcrypt");
const Staff = require("../schemas/staffSchema");
const Student = require("../schemas/studentSchema");
const { verifyStaff, verifyStudent } = require("../middlewares/verifyToken2");
const {
  getStudentFromToken,
  getStaffFromToken,
} = require("../middlewares/verifyToken");

const {
  generateTokenStudent,
  generateTokenStaff,
} = require("../middlewares/jwt");

// student/staff login
const loginController = async (req, res, next) => {
  try {
    //student login

    if (req.body.student) {
      const { schoolCode, loginId, password } = req.body.student;

      const student = await Student.findOne({ schoolCode, loginId });

      if (!student) {
        return res.status(409).json({
          success: false,
          status: "Login failed",
          message: ` Student with login Id ${loginId} and school code ${schoolCode} not found `,
        });
      }

      const hashedPassword = student.password;
      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (passwordMatch) {
        req.user = student;
        await generateTokenStudent(req, res, next);
      } else {
        return res.status(409).json({
          success: false,
          status: "Login failed",
          message: "Incorrect loginId or password",
        });
      }
    }

    //staff login
    else if (req.body.staff) {
      const { schoolCode, loginId, password } = req.body.staff;
      const staff = await Staff.findOne({ schoolCode, loginId });

      if (!staff) {
        return res.status(409).json({
          success: false,
          status: "Login failed",
          message: ` staff with login Id ${loginId} and school code ${schoolCode} not found `,
        });
      }

      if (staff.status === "removed") {
        return res.status(401).json({
          success: false,
          status: "Login failed",
          message:
            "You are removed from school. Contact school administrator for more info",
        });
      }

      const hashedPassword = staff.password;
      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (passwordMatch) {
        req.user = staff;
        await generateTokenStaff(req, res, next);
        // next();
      } else {
        return res.status(409).json({
          success: false,
          status: "Login failed",
          message: "Incorrect loginId or password",
        });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(500).send({
      success: false,
      status: "Login failed",
      message: e.message,
    });
  }
};

// student/staff login from token
const loginController2 = async (req, res, next) => {
  try {
    const user = req.cookies.user;

    if (!user) {
      return res.status(500).send({
        success: false,
        message: `You don't have token`,
      });
    }

    //student login
    if (user === "Student") {
      req.user = await getStudentFromToken(req, res);
    }

    //staff login

    if (user === "Staff") {
      req.user = await getStaffFromToken(req, res);
    }

    req.user.password = undefined;
    req.user.tokens = req.user.tokens.map((ind)=>{
      ind.token = undefined;
      return ind;
    })

    if (!req.user) {
      return res.status(500).send({
        success: false,
      });
    } else {
      next();
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      success: false,
      status: "Login failed",
      message: e.message,
    });
  }
};

// student/staff logOut
const logoutController = async (req, res, next) => {
  try {
    let user1 = req.cookies.user;
    let user;

    let staff;
    let student;

    const schoolCode = req.params.schoolCode;
    const token = req.cookies.jwtCookie;

    if (user1 === "Student") {
      student = await verifyStudent(schoolCode, token);

      if (!student) {
        return res.status(403).send({
          success: false,
          status: "Verification failed",
          message: "Your token is invalid!!",
        });
      }
      const loginId = student.loginId;
      user = await Student.findOne({ loginId }).select("tokens");
    } else if (user1 === "Staff") {
      staff = await verifyStaff(schoolCode, token);
      if (!staff) {
        return res.status(403).send({
          success: false,
          status: "Verification failed",
          message: "Your token is invalid!!",
        });
      }
      const loginId = staff.loginId;
      user = await Staff.findOne({ loginId });
    }

    let tokens = user.tokens;
    tokens = tokens.filter((value) => value.token !== token);

    if (user1 === "Student") {
      const loginId = student.loginId;
      await Student.findOneAndUpdate({ loginId }, { tokens }, { new: true });
    } else if (user1 === "Staff") {
      const loginId = staff.loginId;
      await Staff.findOneAndUpdate({ loginId }, { tokens }, { new: true });
    }
    next();
  } catch (e) {
    console.log(e);
    res.status(500).send({
      success: false,
      status: "LogOut failed",
      message: e.message,
    });
  }
};

module.exports = { logoutController, loginController, loginController2 };