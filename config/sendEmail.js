const nodemailer = require("nodemailer");
// this one is for azure email
const { EmailClient } = require("@azure/communication-email");

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

const connectionString =
  "endpoint=https://for-email-service.india.communication.azure.com/;accesskey=2MTE87oyf1V2VMmSMLBDVchnJH0G7JfYZO8u2zZGmqMR96ZvW7ddJQQJ99AKACULyCp3baDLAAAAAZCSx5Lc";
const client = new EmailClient(connectionString);

async function sendMail2(options) {
  const emailMessage = {
    senderAddress:
      options.from ||
      "DoNotReply@8197d8e7-73ad-44e6-a0d2-12972607c7c1.azurecomm.net",
    content: {
      subject: options.subject,
      // plainText: "I am ujjwal sapkota.",
      html: options.html,
    },
    recipients: {
      to: [{ address: options.to }],
    },
  };

  const poller = await client.beginSend(emailMessage);
  const result = await poller.pollUntilDone();
}

module.exports = { sendMail, sendMail2 };
