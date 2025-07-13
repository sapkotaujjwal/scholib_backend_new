const mongoose = require('mongoose');
const { getDate } = require('../config/nepaliDate');

const gallerySchema = new mongoose.Schema({
  schoolCode: {
    type: Number,
    unique: true,
    minlength: 6,
    maxlength: 6,
    immutable: true,
  },
  gallery: [
    {
      image: {
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
      date: {
        type: Date,
        required: true,
        default: function () {
          const date = getDate();
          return date.fullDate;
        },
      },
      categories: {
        type: [String],
        enum: ['team', 'infrastructure', 'events', 'students', 'services', 'general', 'others'],
        default: ['others'],
      },
    },
  ],
});

const Gallery = mongoose.model('Gallery', gallerySchema);
module.exports = Gallery;
