const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { getDate } = require("../config/nepaliDate");

const studentSchema = new mongoose.Schema({
  // Student's Personal data

  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name should be at least of two characters"],
    maxlength: [80, "Name cannot excedd 80 characters"],
  },
  dob: {
    type: String,
    required: [true, "DOB is required"],
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true,
  },
  course: {
    class: {
      type: String,
      required: true,
      trim: true,
    },
    group: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
    },
  },
  email: {
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
  phone: {
    type: Number,
    required: true,
    minlength: 10,
    maxlength: 10,
  },
  address: {
    type: String,
    trim: true,
    minlength: 2,
    maxlength: [280, "Address cannot exceed 280 characters"],
  },
  psName: {
    type: String,
    trim: true,
    maxlength: [100, "Previous School Name cannot exceed 100 characters"],
  },
  psAddress: {
    type: String,
    trim: true,
    maxlength: [280, "Previous School Address cannot exceed 280 characters"],
  },
  gpa: {
    type: Number,
    min: 0,
    max: 4,
  },
  photo1: {
    blurHash: {
      type: String,
    },
    secure_url: {
      type: String,
    },
    public_id: {
      type: String,
    },
    width: {
      type: String,
    },
    height: {
      type: String,
    },
  },
  photo2: {
    blurHash: {
      type: String,
    },
    secure_url: {
      type: String,
    },
    public_id: {
      type: String,
    },
    width: {
      type: String,
    },
    height: {
      type: String,
    },
  },
  photo3: {
    blurHash: {
      type: String,
    },
    secure_url: {
      type: String,
    },
    public_id: {
      type: String,
    },
    width: {
      type: String,
    },
    height: {
      type: String,
    },
  },
  photo4: {
    blurHash: {
      type: String,
    },
    secure_url: {
      type: String,
    },
    public_id: {
      type: String,
    },
    width: {
      type: String,
    },
    height: {
      type: String,
    },
  },

  //Parent's Info
  fName: {
    type: String,
    required: [true, `Father's Name is required`],
    trim: true,
    minlength: [2, `Father's Name should be at least of two characters`],
    maxlength: [80, `Father's Name cannot excedd 80 characters`],
  },
  mName: {
    type: String,
    required: [true, `Mother's Name is required`],
    trim: true,
    minlength: [2, `Mother's Name should be at least of two characters`],
    maxlength: [80, `Mother's Name cannot excedd 80 characters`],
  },
  phone2: {
    type: Number,
    minlength: 10,
    maxlength: 10,
  },
  fProfession: {
    type: String,
    trim: true,
    maxlength: [80, `Father's Profession cannot excedd 80 characters`],
  },
  mProfession: {
    type: String,
    trim: true,
    maxlength: [80, `Mother's Profession cannot excedd 80 characters`],
  },

  //some extra school tools
  status: {
    type: String,
    required: true,
    enum: ["waiting", "active", "suspended"],
    default: "waiting",
  },
  loginId: {
    type: Number,
    // unique: true,
    minlength: 6,
    maxlength: 6,
    immutable: true,
  },
  schoolCode: {
    type: Number,
    required: true,
    minlength: 6,
    maxlength: 6,
    immutable: true,
  },
  password: {
    type: String,
  },
  year: {
    type: Number,
    required: true,
    default: function () {
      const date = getDate();
      return date.year;
    },
  },

  //Bus
  // bus: {
  //   place: {
  //     type: String,
  //   },
  // },

  //some data related to scholib
  scholib: {
    type: String,
    required: true,
    enum: ["paid", "unpaid"],
    default: "unpaid",
  },

  tokens: [
    {
      device: {
        type: String,
      },
      token: {
        type: String,
      },
    },
  ],

  // here otp is Date for a reason

  otp: {
    otp: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
});

// Hash password before saving
studentSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});

// Pre-save hook
studentSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Only generate code during creation
    let uniqueCode = await generateUniqueCode(
      this.constructor,
      this.schoolCode
    );

    this.loginId = uniqueCode;
  }
  next();
});

// Method to generate a unique 6-digit code for loginId
async function generateUniqueCode(model, schoolCode) {
  while (true) {
    const num = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit number
    const code = parseInt(num);

    // Check if any document already has this loginId
    const existingStudent = await model.findOne({
      loginId: code,
      schoolCode: schoolCode,
    });

    if (!existingStudent) {
      return code;
    }
  }
}

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;
