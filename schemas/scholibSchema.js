const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { getDate } = require("../config/nepaliDate");

const scholibSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name should be at least of two characters"],
    maxlength: [80, "Name cannot excedd 80 characters"],
  },
  logo: {
    secure_url: {
      type: String,
    },
  },
  loginId: {
    type: Number,
    unique: true,
    minlength: 6,
    maxlength: 6,
  },
  password: {
    type: String,
  },
  createdAt: {
    type: String,
    required: true,
    default: function () {
      const date = getDate();
      return date.fullDate;
    },
  },
});

// Hash password before saving
scholibSchema.pre("save", async function (next) {
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
scholibSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Only generate code during creation
    let uniqueCode = await generateUniqueCode(this.constructor);
    this.loginId = uniqueCode;
  }
  next();
});

// Method to generate a unique 6-digit code
async function generateUniqueCode(model) {
  while (true) {
    const num = Math.floor(100000 + Math.random() * 900000).toString();
    const code = parseInt(num);
    const existingMember = await model.findOne({ loginId: code });
    if (!existingMember) {
      return code;
    }
  }
}

const Scholib = mongoose.model("Scholib", scholibSchema);
module.exports = Scholib;
