const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "email-smtp.ap-south-1.amazonaws.com",
  port: 465,
  secure: true,
  auth: {
    user: "AKIA6ODU65XH2TLMGX6E",
    pass: "BIR1hBa6ndjXIRe036KR8HRKiEQFceSGL068UprQ0bZH",
  },
});

function sendMail(mailOptions) {
  // here i will have my send email code which i am currently going to comment for        obvious reasons

  // return new Promise((resolve, reject) => {
  //   transporter.sendMail(mailOptions, (error, info) => {
  //     if (error) {
  //       reject(error);
  //     } else {
  //       resolve(info.response);
  //     }
  //   });
  // });

  // return 2 + 2;
}

module.exports = { sendMail };
