const mongoose = require("mongoose");
const { getDate } = require("../config/nepaliDate");

const libraySchema = new mongoose.Schema({
  // Account Details
  schoolCode: {
    type: Number,
    required: true,
    minlength: 6,
    maxlength: 6,
    immutable: true,
  },

  // library
  library: [
    {
      date: {
        type: Date,
        default: function () {
          const date = getDate();
          return date.fullDate;
        },
      },
      book: {
        type: String,
        required: [true, `Book Name is required`],
        trim: true,
        minlength: [2, `Book Name should be at least of two characters`],
        maxlength: [100, `Book Name cannot excedd 80 characters`],
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
      },
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
      returnDate: {
        type: Date,
        default: function () {
          const date = getDate();
          return date.year + 1;
        },
      },
      status: {
        type: String,
        enum: ["Returned", "Not Returned"],
        default: "Not Returned",
      },
      returnedDate: {
        type: Date,
      },
    },
  ],
});

const Library = mongoose.model("Library", libraySchema);
module.exports = Library;
