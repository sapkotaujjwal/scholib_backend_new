const express = require('express');
const router = express.Router();

const { findSchoolHome, findSchoolGallery, findSchoolUpdates, findSchoolCourses ,schoolAdmission, addReview } = require('../controllers/basicController')
const upload = require("../config/multer");

//usage
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { getCurrentNepaliDate } = require('../config/nepaliDate');

//middlewares
router.use(express.json());
router.use(cookieParser());
router.use(bodyParser.urlencoded({ extended: true }));

// get entire nepali date and time 

router.get('/nepaliDate/v1', async (req,res)=>{
    const data = getCurrentNepaliDate ();
  
    res.status(200).send({
      success: true,
      status: 'Date Fetched Successfully',
      data
    })
  
  
  })

// get school home
router.get('/:schoolCode/', findSchoolHome, (req, res) => {
    res.status(200).send({
        success: true,
        data:req.school
    });
});

// get school gallery
router.get('/:schoolCode/gallery', findSchoolGallery, (req, res) => {
    res.status(200).send({
        success: true,
        data: req.gallery,
        totalCount: req.totalCount,
    });
});

//get school courses
router.get('/:schoolCode/courses', findSchoolCourses , (req, res) => {
    res.status(200).send({
        success: true,
        status: 'Courses are fetched successfully',
        data: req.courses,
    });
});

// get school updates
router.get('/:schoolCode/updates', findSchoolUpdates, (req, res) => {
   return res.status(200).send({
        success: true,
        data: req.updates,
    });
});

//students admission
router.post('/:schoolCode/admission', upload.fields([
    { name: 'photo1', maxCount: 1 },
    { name: 'photo2', maxCount: 1 },
    { name: 'photo3', maxCount: 1 },
    { name: 'photo4', maxCount: 1 },
  ]), schoolAdmission , (req, res) => {
   return res.status(200).send({    
         success: true,
        message: "Your application has been submitted"
    });
});


//Add a review
router.post('/:schoolCode/review/add', addReview , (req, res) => {
   return res.status(200).send({    
         success: true,
         status: 'Review added successfully',
         message: "You added a review Successfully"
    });
});

module.exports = router;
