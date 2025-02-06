const mongoose = require("mongoose");
const Company = require("../schemas/companySchema");

const connectDb = async (
  dburi = "mongodb://scholibAdmin:newPassword@3.111.220.76:27017?replicaSet=rs0&authSource=admin"
) => {
  try {
    await mongoose.connect(dburi, {
      dbName: "scholib",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    let company = await Company.find();

    if (Array.isArray(company) && company.length === 0) {
      let ourCompany = new Company({
        _id: "6682b2b28051d8ae2f37cb05",
        name: "Scholib Tech",
        url: "https://scholib.com",
        logo: {
          blurHash: "sampleBlurHash",
          secure_url: "https://scholib.com/images/logo.png",
          public_id: "samplePublicID",
          height: "100",
          width: "200",
        },
        phone: [9806014021],
        email: ["contact@scholib.com"],
        location: "BUddhashanti 2 Budhabare Jhapa",
        coordinates: "40.7128° N, 74.0060° W",
        social: {
          facebook: "https://www.facebook.com/samplecompany",
          twitter: "https://twitter.com/scholib",
          instagram: "https://www.instagram.com/scholib.official",
          youtube: "https://www.youtube.com/@scholib",
          linkedIn: "https://www.linkedin.com/scholib",
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
