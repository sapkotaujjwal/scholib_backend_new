// This one works for replica set and is currently being used on local development

const mongoose = require("mongoose");
const Company = require("../schemas/companySchema");

const connectDb = async (
  dburi = "mongodb://scholibAdmin:newPassword@3.111.220.76:27017/newServer?replicaSet=rs0&authSource=admin"
) => {
  try {
    await mongoose.connect(dburi, {
      dbName: "newServer2",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // check for company
    let company = await Company.find();

    if (Array.isArray(company) && company.length === 0) {
      let ourCompany = new Company({
        _id: "6682b2b28051d8ae2f37cb05",
        name: "Scholib Tech Pvt. Ltd",
        url: "https://www.scholib.com",
        logo: {
          blurHash: "sampleBlurHash",
          secure_url:
            "https://res.cloudinary.com/dodvbotgd/image/upload/v1728286440/ppchehqmfsci6rejuoqm.jpg",
          public_id: "samplePublicID",
          height: "100",
          width: "200",
        },
        phone: [9806014021],
        email: ["admin@scholib.com"],
        location: "BUddhashanti 2 Budhabare Jhapa",
        coordinates: "40.7128° N, 74.0060° W",
        social: {
          facebook: "https://www.facebook.com/samplecompany",
          twitter: "https://twitter.com/samplecompany",
          instagram: "https://www.instagram.com/samplecompany",
          youtube: "https://www.youtube.com/samplecompany",
          linkedIn: "https://www.linkedin.com/company/samplecompany",
        },
        usedBy: 0,
        noOfSchools: 0,
        TermsAndConditions: ["Policy 1 content", "Policy 2 content"],
        privacyPolicy: [
          {
            title: "Privacy Policy 1",
            content: "Privacy Policy 1 content",
          },
          {
            title: "Privacy Policy 2",
            content: "Privacy Policy 2 content",
          },
        ],
        reviews: [],
        schools: [],
      });

      await ourCompany.save();
    }

    console.log("MongoDB Connected");


  } catch (error) {
    console.error("MongoDB failed to connect:", error.message);
  }
};

module.exports = connectDb;

// This one is for the server so make sure to make it the way it works

// const connectDb = async (dburi = "mongodb://127.0.0.1:27017", username='adminUsername', password='password123') => {
//     try {
//         // Construct the full MongoDB URI with username and password
//         const uri = `${dburi}/scholibNew?authSource=admin`;

//         await mongoose.connect(uri, {
//             user: username,
//             pass: password,
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });
//         console.log('MongoDB connected successfully');
//     } catch (error) {
//         console.log(error);
//         console.log('MongoDB failed to connect');
//     }
// };

// module.exports = connectDb;
