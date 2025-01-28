// This one is for aws SES

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

  if(mailOptions.to !== 'sumanjhah39@gmail.com'){
    console.log("Email is not sent as it is not sent to sumanjhah39@gmail.com");
    return;
  }

  return;


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










// this one is for azure email
const { EmailClient } = require("@azure/communication-email");

const connectionString =
  "endpoint=https://for-email-service.india.communication.azure.com/;accesskey=2MTE87oyf1V2VMmSMLBDVchnJH0G7JfYZO8u2zZGmqMR96ZvW7ddJQQJ99AKACULyCp3baDLAAAAAZCSx5Lc";
const client = new EmailClient(connectionString);

async function sendMail2(options) {
  return 1+1;
  const emailMessage = {
    senderAddress:
      // options.from ||
      "DoNotReply@scholib.com",
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
