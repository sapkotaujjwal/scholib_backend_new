var { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.com/";
const token =
  "Zoho-enczapikey wSsVR60k/RH1X/t5lDSqLu1pn1pVVFmnQ0l6jAbz7yOvHv/K98c/khDMBVOhGaAZEjY6FGBB9+l/zRgJhzoN3NgtnFBRWyiF9mqRe1U4J3x17qnvhDzKXmpZkxKIKooPzwRqmGJhFckq+g==";

let client = new SendMailClient({ url, token });

function sendMail(mailOptions) {
  if (mailOptions.to !== "ujjwalint22@gmail.com") {
    console.log("Email is not sent as it is not sent to ujjwalint22@gmail.com");
    return;
  }

  client
    .sendMail({
      from: {
        address: "no-reply@ujjwalsapkota.name.np",
        name: "Scholib",
      },
      to: [
        {
          email_address: {
            address: mailOptions.to,
            name: mailOptions.to,
          },
        },
      ],
      subject: mailOptions.subject,
      htmlbody: mailOptions.html,
    })
    .then((resp) => console.log("success"))
    .catch((error) => console.log("error"));
}

module.exports = { sendMail };
