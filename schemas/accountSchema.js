const mongoose = require("mongoose");
const { getDate } = require("../config/nepaliDate");

const accountSchema = new mongoose.Schema({
  schoolCode: {
    type: Number,
    required: true,
    minlength: 6,
    maxlength: 6,
    immutable: true,
  },
  paymentHistory: [
    {
      date: {
        type: Number,
        default: function () {
          const date = getDate();
          return date.fullDate;
        },
      },
      amount: {
        type: Number,
        required: true,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
      },
      method: {
        type: String,
        required: true,
        enum: ["cash", "scholib"],
        default: "cash",
      },
      time: {
        type: String,
      },
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    },
  ],
});

const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
