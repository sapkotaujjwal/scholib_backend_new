const mongoose = require("mongoose");
const { getDate } = require("../config/nepaliDate");

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name should be at least of two characters"],
    maxlength: [120, "Name cannot excedd 80 characters"],
  },
  url: {
    type: String,
    required: [true, "url is required"],
    trim: true,
    minlength: [2, "url should be at least of two characters"],
    maxlength: [80, "ur; cannot excedd 80 characters"],
  },
  logo: {
    blurHash: {
      type: String,
    },
    secure_url: {
      type: String,
    },
    public_id: {
      type: String,
    },
    height: {
      type: String,
    },
    width: {
      type: String,
    },
  },
  phone: [
    {
      type: Number,
      required: true,
      minlength: 10,
      maxlength: 10,
    },
  ],
  email: [
    {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Invalid email address",
      },
    },
  ],
  location: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: [500, "Full Address cannot exceed 280 characters"],
  },
  coordinates: {
    type: String,
    trim: true,
    minlength: 2,
    maxlength: [120, "Coordinates cannot exceed 120 characters"],
  },
  social: {
    facebook: {
      type: String,
    },
    twitter: {
      type: String,
    },
    instagram: {
      type: String,
    },
    youtube: {
      type: String,
    },
    linkedIn: {
      type: String,
    },
  },
  usedBy: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      _id: {
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 250,
      },
      rating: {
        type: Number,
        default: 0,
      },
      message: {
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 450,
      },
    },
  ],
  noOfSchools: {
    type: Number,
    default: 0,
  },
  TermsAndConditions: {
    type: [String],
    trim: true,
    validate: [
      {
        validator: function (arr) {
          return arr.every(
            (policy) => policy.length >= 3 && policy.length <= 200
          );
        },
        message: "Each Policy should be between 3 and 200 characters long",
      },
    ],
  },
  privacyPolicy: [
    {
      title: {
        type: String,
      },
      content: {
        type: String,
      },
    },
  ],
  schools: [
    {
      info: {
        type: String,
        required: true,
      },
      schoolCode: {
        type: Number,
        required: true,
      },
      joinedOn: {
        type: String,
        default: function () {
          const date = getDate();
          return date.fullDate;
        },
      },
    },
  ],
});

const Company = mongoose.model("Company", companySchema);
module.exports = Company;
