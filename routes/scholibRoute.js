const express = require('express');

const router = express.Router();
const {createSchool , loginController , signinController , createSchoolAdmin , createCompany, createSchoolWithAdmin, findCompany, updateCompany } = require('../controllers/createSchool')

//usage
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const upload = require('../config/multer');

//middlewares
router.use(express.json());
router.use(cookieParser());
router.use(bodyParser.urlencoded({ extended: true }));


// Create new Scholib team member
router.post('/users/new', signinController , (req, res) => {
    const user = req.user;
    res.status(201).send({
        success: true,
        data: user,
    });
});

//create new school
router.post('/newSchool', loginController, createSchool , (req, res) => {
    const school = req.school;
    res.status(201).send({
        success: true,
        data: school,
    });
});

//create new school admin
router.post('/newSchoolAdmin', loginController, createSchoolAdmin , (req, res) => {
    const school = req.school;
    res.status(201).send({
        success: true,
        data: school,
    });
});


//Creating new school with a admin staff
router.post('/newSchool2', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'images', maxCount: 4 },
    { name: 'pPhoto', maxCount: 1 },
    { name: 'principlePhoto', maxCount: 1 },
  ]), createSchoolWithAdmin , (req, res) => {
    res.status(200).send({    
         success: true,
         status: 'School Created Successfully',
         message: "School Code and admin login Id will be sent to your email You can Login using the credentials"
    });
});

//find company
router.get('/company', findCompany, (req, res) => {
    const data = req.company;
    res.status(200).send({
        success: true,
        data
    });
});

//create company 
router.post('/company/create' , upload.fields([
    { name: 'logo', maxCount: 1 },
  ]) , createCompany ,  (req, res) => {
    const company = req.company;
    res.status(201).send({
        success: true,
        data: company,
    });
});

//update company
router.put('/company/update', loginController , upload.fields([
    { name: 'logo', maxCount: 1 },
  ]) , updateCompany ,  (req, res) => {
    const company = req.company;
    res.status(201).send({
        success: true,
        data: company
    });
});


module.exports = router;
