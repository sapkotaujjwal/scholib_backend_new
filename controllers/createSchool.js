const { School } = require("../schemas/schoolSchema");
const Scholib = require("../schemas/scholibSchema");
const Staff = require("../schemas/staffSchema");
const bcrypt = require("bcrypt");
const Gallery = require("../schemas/gallerySchema");
const Update = require("../schemas/updateSchema");
const { CourseNew } = require("../schemas/courseSchema");
const Account = require("../schemas/accountSchema");
const Exam = require("../schemas/examSchema");
const Company = require("../schemas/companySchema");
const { photoWork } = require("../config/photoWork");
const Library = require("../schemas/librarySchema");
const { sendMail } = require("../config/sendEmail");

require("dotenv").config({ path: "./config/config.env" });

// scholib signin
const signinController = async (req, res, next) => {
  try {
    const user = req.body;
    const data = new Scholib(user);
    req.user = await data.save();
    next();
  } catch (error) {
    res.status(500).send({
      success: false,
      status: "Creation failed",
      message: error.message,
    });
  }
};

// scholib login
const loginController = async (req, res, next) => {
  try {
    const { loginId, password } = req.body.admin;
    const user = await Scholib.findOne({ loginId });
    if (!user) {
      return res.status(401).send({
        success: false,
        status: "Authentication failed",
        message: "Scholib member has his/her credentials wrong",
      });
    }
    const hashedPassword = user.password;
    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    if (passwordMatch) {
      next();
    } else {
      return res.status(401).send({
        success: false,
        status: "Authentication failed",
        message: "Scholib member has his/her credentials wrong",
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      status: "Authentication failed",
      message: error.message,
    });
  }
};

//my new create new school with admin

// const createSchoolWithAdmin = async (req, res, next) => {
//   try {
//     const Maindata = req.body;

//     Maindata.admin = JSON.parse(Maindata.admin);
//     Maindata.school = JSON.parse(Maindata.school);
//     Maindata.staff = JSON.parse(Maindata.staff);

//     const school = Maindata.school;
//     school.images = [];

//     const company = await Company.findOne({ _id: process.env.COMPANY_ID });

//     if (req.files && req.files["logo"]) {
//       school.logo = await photoWork(req.files["logo"][0]);
//     }

//     if (req.files && req.files["principlePhoto"]) {
//       school.principle.image = await photoWork(req.files["principlePhoto"][0]);
//     }

//     if (req.files && req.files["images"]) {
//       for (const file of req.files["images"]) {
//         const photo = await photoWork(file);
//         const image = {
//           blurHash: photo.blurHash,
//           secure_url: photo.secure_url,
//           public_id: photo.public_id,
//           height: photo.height,
//           width: photo.width,
//         };
//         school.images.push(image);
//       }
//     }

//     //saving school to the database
//     const data = new School(school);
//     req.school = await data.save();
//     const schoolCode = req.school.schoolCode;

//     const galleyObj = {
//       schoolCode,
//     };
//     const accountObj = {
//       schoolCode,
//     };
//     const updateObj = {
//       schoolCode,
//     };
//     const libraryObj = {
//       schoolCode,
//       library: [],
//     };

//     const gallery = new Gallery(galleyObj);
//     const account = new Account(accountObj);
//     const update = new Update(updateObj);
//     const library = new Library(libraryObj);

//     await gallery.save();
//     await account.save();
//     await update.save();
//     await library.save();

//     company.noOfSchools++;

//     const schoolString = `${req.school.schoolCode} ${req.school.name} ${
//       req.school.sName
//     } ${req.school.address.split(" ")[0]}`;

//     const newSchoolObj = {
//       info: schoolString,
//       schoolCode: req.school.schoolCode,
//     };

//     company.schools.push(newSchoolObj);
//     await company.save();

//     const schoolFind = await School.findOne({ schoolCode });

//     const adminData = req.body.staff;
//     adminData.schoolCode = schoolCode;
//     adminData.tokens = [];

//     if (req.files["pPhoto"]) {
//       adminData.pPhoto = await photoWork(req.files["pPhoto"][0]);
//     }

//     function generateOTP() {
//       const characters = "0123456789abcdefghijklmnopqrstuvwxyz";
//       let otp = "";
//       for (let i = 0; i < 8; i++) {
//         otp += characters[Math.floor(Math.random() * characters.length)];
//       }
//       return otp;
//     }

//     let tempPass = generateOTP();
//     adminData.password = tempPass;

//     const newStaff = new Staff(adminData);
//     const createdStaff = await newStaff.save();

//     schoolFind.staffs.push(createdStaff);
//     const schoolRetrived = await schoolFind.save();

//     const mailOptions = {
//       from: "no-reply@ujjwalsapkota.name.np",
//       to: createdStaff.email,
//       subject: `Scholib account created || Login to ${schoolRetrived.name}`,
//       html: `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>School account created </title>
//     <style>
//         body {
//             font-family: Arial, sans-serif;
//             background-color: #f4f4f4;
//             margin: 0;
//             padding: 0;
//         }
//         .container {
//             max-width: 600px;
//             margin: 20px auto;
//             background-color: #ffffff;
//             padding: 20px;
//             border-radius: 10px;
//             box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
//         }
//         .header {
//             text-align: center;
//             background-color: #4CAF50;
//             padding: 10px;
//             border-radius: 10px 10px 0 0;
//         }
//         .header h1 {
//             margin: 0;
//             color: #ffffff;
//         }
//         .content {
//             padding: 20px;
//         }
//         .content p {
//             font-size: 16px;
//             line-height: 1.6;
//             color: #333333;
//         }
//         .login-details {
//             background-color: #f9f9f9;
//             padding: 10px;
//             border: 1px solid #dddddd;
//             border-radius: 5px;
//             margin-top: 20px;
//         }
//         .footer {
//             text-align: center;
//             font-size: 14px;
//             color: #777777;
//             margin-top: 20px;
//         }
//     </style>
// </head>
// <body>
//     <div class="container">
//         <div class="header">
//             <h1>Welcome to Scholib!</h1>
//         </div>
//         <div class="content">
//             <p>Dear ${createdStaff.name},</p>
//             <p>Your scholib account has been created. Now you can login to your school through the following credentials</p>
//             <p>Visit scholib.com and login through the following credentials</p>
//             <div class="login-details">
//                 <p><strong>School Code:</strong> ${schoolRetrived.schoolCode}</p>
//                 <p><strong>Login ID:</strong> ${createdStaff.loginId}</p>
//                 <p><strong>Password:</strong> ${tempPass}</p>
//             </div>
//             <p>Please keep this information secure and do not share it with anyone.</p>
//             <p>Best regards,<br>Scholib.com</p>
//         </div>
//         <div class="footer">
//             <p>&copy; 2024 Scholib.com. All rights reserved.</p>
//         </div>
//     </div>
// </body>
// </html>

//       `,
//     };

//     sendMail(mailOptions);

//     next();
//   } catch (e) {
//     console.log(e);
//     return res.status(400).send({
//       success: false,
//       status: "School Creation Failed",
//       message: e.message,
//     });
//   }
// };

const createSchoolWithAdmin = async (req, res, next) => {
  try {
    const Maindata = {
      admin: JSON.parse(req.body.admin),
      school: JSON.parse(req.body.school),
      staff: JSON.parse(req.body.staff),
    };

    const { school } = Maindata;
    school.images = [];

    const [company, logo, principlePhoto, images, pPhoto] = await Promise.all([
      Company.findById(process.env.COMPANY_ID),
      req.files?.logo ? photoWork(req.files.logo[0]) : null,
      req.files?.principlePhoto ? photoWork(req.files.principlePhoto[0]) : null,
      req.files?.images ? Promise.all(req.files.images.map(photoWork)) : [],
      req.files?.pPhoto ? photoWork(req.files.pPhoto[0]) : null,
    ]);

    if (logo) school.logo = logo;
    if (principlePhoto) school.principle.image = principlePhoto;

    if (images.length) {
      school.images = images.map((photo) => ({
        blurHash: photo.blurHash,
        secure_url: photo.secure_url,
        public_id: photo.public_id,
        height: photo.height,
        width: photo.width,
      }));
    }

    const newSchool = new School(school);
    req.school = await newSchool.save();

    const schoolCode = req.school.schoolCode;

    await Promise.all([
      new Gallery({ schoolCode }).save(),
      new Account({ schoolCode }).save(),
      new Update({ schoolCode }).save(),
      new Library({ schoolCode, library: [] }).save(),
    ]);

    company.noOfSchools++;
    company.schools.push({
      info: `${schoolCode} ${req.school.name} ${req.school.sName} ${
        req.school.address.split(" ")[0]
      }`,
      schoolCode,
    });
    await company.save();

    const adminData = {
      ...Maindata.staff,
      schoolCode,
      tokens: [],
      password: generateOTP(),
      pPhoto: pPhoto || null,
    };

    const createdStaff = await new Staff(adminData).save();
    await School.updateOne(
      { schoolCode },
      { $push: { staffs: createdStaff } }
    );

    sendWelcomeEmail(createdStaff, req.school, adminData.password);

    next();
  } catch (e) {
    console.error(e);
    res.status(400).send({
      success: false,
      status: "School Creation Failed",
      message: e.message,
    });
  }
};

function generateOTP(length = 8) {
  const characters = "0123456789abcdefghijklmnopqrstuvwxyz";
  return Array.from(
    { length },
    () => characters[Math.floor(Math.random() * characters.length)]
  ).join("");
}

function sendWelcomeEmail(createdStaff, school, tempPass) {
  const mailOptions = {
    from: "no-reply@ujjwalsapkota.name.np",
    to: createdStaff.email,
    subject: `Scholib account created || Login to ${school.name}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>School account created</title>
      <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
          .header { text-align: center; background-color: #4CAF50; padding: 10px; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; color: #ffffff; }
          .content { padding: 20px; }
          .content p { font-size: 16px; line-height: 1.6; color: #333333; }
          .login-details { background-color: #f9f9f9; padding: 10px; border: 1px solid #dddddd; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; font-size: 14px; color: #777777; margin-top: 20px; }
      </style>
      </head>
      <body>
      <div class="container">
          <div class="header"><h1>Welcome to Scholib!</h1></div>
          <div class="content">
              <p>Dear ${createdStaff.name},</p>
              <p>Your Scholib account has been created. You can now log in to your school with the following credentials:</p>
              <div class="login-details">
                  <p><strong>School Code:</strong> ${school.schoolCode}</p>
                  <p><strong>Login ID:</strong> ${createdStaff.loginId}</p>
                  <p><strong>Password:</strong> ${tempPass}</p>
              </div>
              <p>Please keep this information secure and do not share it with anyone.</p>
              <p>Best regards,<br>Scholib.com</p>
          </div>
          <div class="footer"><p>&copy; 2024 Scholib.com. All rights reserved.</p></div>
      </div>
      </body>
      </html>`,
  };

  sendMail(mailOptions);
}

// find scholib home
const findCompany = async (req, res, next) => {
  try {
    const _id = process.env.COMPANY_ID;
    const company = await Company.findOne({ _id });
    if (!company) {
      return res.status(404).send({
        success: false,
        status: "Scholib info failed to fetch",
        message:
          "Something unexpected happened. The route will be ready soon !!",
      });
    }
    req.company = company;
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

// create scholib info
const createCompany = async (req, res, next) => {
  try {
    const data = req.body.company;
    delete data.usedBy;
    delete data.reviews;
    delete data.noOfSchools;

    if (req.files && req.files["photo"]) {
      for (const file of req.files["photo"]) {
        const photo = await photoWork(file);
        const image = {
          blurHash: photo.blurHash,
          secure_url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        data.logo = image;
      }
    }

    const company = new Company(data);
    req.company = await company.save();
    next();
  } catch (error) {
    res.status(500).send({
      success: false,
      status: "Company creation failed",
      message: error.message,
    });
  }
};

// update scholib home
async function updateCompany(req, res, next) {
  try {
    const _id = process.env.COMPANY_ID;
    const newCompany = req.body;
    delete newCompany.usedBy;
    delete newCompany.reviews;
    delete newCompany.noOfSchools;

    // for logo
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
        newCompany.logo = image;
      }
    }

    const company = await Company.findOneAndUpdate({ _id }, newCompany, {
      new: true,
      upsert: false,
    });

    if (!company) {
      return res.status(403).send({
        success: false,
        status: `Company update failed`,
        message: ` Company schma not found for _id ${_id} `,
      });
    }
    req.company = company;
    next();
  } catch (e) {
    return res.status(500).send({
      success: false,
      status: `Update creation failed`,
      message: e.message,
    });
  }
}

module.exports = {
  signinController,
  updateCompany,
  findCompany,
  loginController,
  createSchoolWithAdmin,
  createCompany,
};
