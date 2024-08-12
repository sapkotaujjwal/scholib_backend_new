const mongoose = require('mongoose');
const { getDate } = require('../config/nepaliDate');
// const Staff = require('./staffSchema');

const updateSchema = new mongoose.Schema({
  schoolCode: {
    type: Number,
    unique: true,
    minlength: 6,
    maxlength: 6,
    immutable: true
  },
  update: [{ 
    title:{
    type: String,
    required: [true,'Title is Required'],
    minlength: 2,
    maxlength: 10000,
  },
  date:{
    type: Date,
    required: true,
    default: function () {
      const date = getDate();
        return date.fullDate;
      },
  },
  time:{
    type: String,
  },
  images: [{
    blurHash:{
      type : String
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
      type : String
    },
  }],
  author: {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff'
        },
        name: {
          type: String,
        },
        title: {
          type: String,
        },
    },
  showTo:{
    type: String,
    required: true,
    enum: ['Everyone','Members','Staffs'],
    default: 'Everyone'
  }}]
});

const Update = mongoose.model('Update',updateSchema)
module.exports = Update;