const mongoose = require("mongoose");

const ExamSchema = new mongoose.Schema({
  schoolCode: {
    type: Number,
    ref: "School",
    required: true,
  },
  term: [
    {
      termName: {
        type: String,
        required: true,
        maxlength: 50,
      },
      status: {
        type: String,
        required: true,
        enum: ["Published", "Unpublished"],
        default: "Unpublished",
      },
      publishedDate: {
        type: String,
      },
      subjects: [
        {
          _id: {
            type: String,
          },
          subject: {
            type: String,
          },
          fullMarks: {
            type: Number,
            required: true,
          },
          fullMarks2: {
            type: Number,
          },
          passMarks: {
            type: Number,
            required: true,
          },
          passMarks2: {
            type: Number,
          },
          highestScore: {
            type: Number,
          },
          students: [
            {
              student: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "StudentNew",
                required: true,
              },
              obtainedMarks: {
                type: Number,
                default: 0,
              },
              obtainedMarks2: {
                type: Number,
                default: 0,
              },
            },
          ],
        },
      ],
    },
  ],
});

const Exam = mongoose.model("Exam", ExamSchema);
module.exports = Exam;
