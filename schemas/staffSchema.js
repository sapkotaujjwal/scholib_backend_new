const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { getDate } = require("../config/nepaliDate");

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name should be at least two characters"],
    maxlength: [80, "Name cannot exceed 80 characters"],
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    minlength: [2, "Title should be at least two characters"],
    maxlength: [50, "Title cannot exceed 50 characters"],
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
    type: String,
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
  qualification: {
    type: String,
    trim: true,
    minlength: [2, "Degree should be at least two characters"],
    maxlength: [100, "Degree cannot exceed 100 characters"],
  },
  about: {
    type: String,
    trim: true,
    minlength: 2,
    maxlength: [600, "About cannot exceed 600 characters"],
  },
  dob: {
    type: String,
    required: [true, "DOB is required"],
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  pPhoto: {
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

  // Some extra school tools
  status: {
    type: String,
    required: true,
    enum: ["active", "removed"],
    default: "active",
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
    immutable: true,
    minlength: 6,
    maxlength: 6,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: [
      "Administrator",
      "Coordinator",
      "Moderator",
      "Staff",
      "Teacher",
      "Worker",
    ],
    default: "Worker",
  },

    // here expiresAt is Date for a reason
    
  otp: {
    otp: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    count: {
      type: Number,
    },
  },

  // Some data related to Scholib
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
});

// Hash password before saving
staffSchema.pre("save", async function (next) {
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

// Pre-save hook for generating a unique loginId
staffSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Only generate a code during creation
    let uniqueCode = await generateUniqueCode(
      this.constructor,
      this.schoolCode
    );
    this.loginId = uniqueCode;
  }
  next();
});

// Method to generate a unique 6-digit code
async function generateUniqueCode(model, schoolCode) {
  while (true) {
    const num = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit number
    const code = parseInt(num);

    // Check if the generated code already exists in the entire collection
    const existingStaff = await model.findOne({ loginId: code, schoolCode });


    if (!existingStaff) {
      return code; // Return the unique code if it doesn't exist
    }
  }
}

const Staff = mongoose.model("Staff", staffSchema);
module.exports = Staff;
