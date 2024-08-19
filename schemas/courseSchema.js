const mongoose = require("mongoose");
const { getDate } = require("../config/nepaliDate");

// Course Schema
const courseSchema = new mongoose.Schema({
  schoolCode: {
    type: Number,
    ref: "School",
    required: true,
  },
  class: {
    type: String,
    required: true,
    maxlength: 50,
  },
  startDate: {
    type: Date,
    default: function () {
      const date = getDate();
      return date.fullDate;
    },
  },
  seatsAvailable: {
    type: Number,
    required: true,
    default: 999,
  },
  courseId:{
    type: String
  },
  subjects: [{ type: String }],
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "GroupNew" }],
  fees: [{ title: String, amount: { type: Number, min: 0 } }],
});
const CourseNew = mongoose.model("CourseNew", courseSchema);

// Group Schema
const groupSchema = new mongoose.Schema({
  name: String,
  subjects: [{ type: String }],
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "SectionNew" }],
});
const GroupNew = mongoose.model("GroupNew", groupSchema);

// Section Schema
const sectionSchema = new mongoose.Schema({
  name: String,
  workingDates: [Date],
  subjects: [
    {
      subject: String,
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
      },
    },
  ],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudentNew" }],
  exams: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
});
const SectionNew = mongoose.model("SectionNew", sectionSchema);

// Student Schema
const studentSchema = new mongoose.Schema({
  name: String,
  roll: String,
  // section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
  absentDays: [
    {
      date: { type: Date, default: getDate().fullDate },
      reason: { type: String, default: "unknown" },
    },
  ],
  discount: [
    {
      date: Date,
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      amount: { type: Number, min: 0 },
      remark: { type: String, maxlength: 1000 },
    },
  ],
  fine: [
    {
      date: Date,
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      amount: { type: Number, min: 0 },
      remark: { type: String, maxlength: 1000 },
    },
  ],
  previousLeft: { type: Number, default: 0 },
  paymentHistory: [
    {
      date: Date,
      time: String,
      amount: Number,
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      method: { type: String, enum: ["Cash", "Scholib"] },
      remark: { type: String, maxlength: 1000 },
    },
  ],
  library: [
    {
      date: Date,
      book: {
        type: String,
        required: [true, "Book Name is required"],
        trim: true,
        minlength: [2, "Book Name should be at least of two characters"],
        maxlength: [100, "Book Name cannot exceed 80 characters"],
      },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      returnDate: Date,
      status: {
        type: String,
        enum: ["Returned", "Not Returned"],
        default: "Not Returned",
      },
      returnedDate: Date,
    },
  ],
  bus: [
    {
      place: String,
      start: Date,
      end: Date,
    },
  ],
});
const StudentNew = mongoose.model("StudentNew", studentSchema);

module.exports = {
  CourseNew,
  GroupNew,
  SectionNew,
  StudentNew,
};
