const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "email-smtp.ap-south-1.amazonaws.com",
  port: 465,
  secure: true,
  auth: {
    user: "AKIA6ODU65XH3AEL4HST",
    pass: "BIqXhyOHIEHAc61v3qhGoG2lzrpgnFuw31/nblpDLrwl",
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

  return 2 + 2;
}

module.exports = { sendMail };
