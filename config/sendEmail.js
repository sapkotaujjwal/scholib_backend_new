const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "email-smtp.ap-south-1.amazonaws.com",
  port: 465,
  secure: true,
  auth: {
    user: "AKIA6ODU65XH5AD4O2XC",
    pass: "BGLltE9yntBpMHb6jZJKca4QeSM0o4OgSP/h85ZqAWEU",
  },
});

function sendMail(mailOptions) {
  // here i will have my send email code which i am currently going to comment for        obvious reasons

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info.response);
      }
    });
  });
}

module.exports = { sendMail };
