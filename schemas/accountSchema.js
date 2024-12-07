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
  year: {
    type: Number,
    default: getDate().year,
  },
  paymentHistory: [
    {
      date: String,
      time: String,
      amount: Number,
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      method: { type: String, enum: ["Cash", "Scholib"] },
      remark: { type: String, maxlength: 1000 },
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentNew",
      },
    },
  ],
});

const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
