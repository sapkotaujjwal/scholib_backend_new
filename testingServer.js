require("dotenv").config({ path: "./config/config.env" });
const connectDb = require("./config/database");
const mongoose = require("mongoose");

const { School } = require("./schemas/schoolSchema");

const { faker } = require("@faker-js/faker");
const Staff = require("./schemas/staffSchema");
const { startNewSession } = require("./controllers/startNewSessionNew");

// connect to database for local system
connectDb(process.env.DB_URI);

// connect to database for the server version
// connectDb();

const fs = require("fs");

const { acceptAdmission } = require("./controllers/studentsControlsMain");
const Gallery = require("./schemas/gallerySchema");
const Account = require("./schemas/accountSchema");
const Update = require("./schemas/updateSchema");
const Library = require("./schemas/librarySchema");
const Company = require("./schemas/companySchema");
const Student = require("./schemas/studentSchema");

const writeToFile = (obj, filePath = "./school.txt") => {
  const jsonString = JSON.stringify(obj, null, 2);

  fs.writeFile(filePath, jsonString, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
      return;
    }
    console.log("Successfully wrote to file:", filePath);
  });
};

const defaultSecureUrl =
  "https://images.pexels.com/photos/18091667/pexels-photo-18091667/free-photo-of-istanbul-istinye.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

const blurHash = "UWG7xOS|xYxZ?a$~$$kB~AxWbYoe={s+s,xF";

function generateFakeSchoolData() {
  return {
    logo: {
      blurHash,
      secure_url: defaultSecureUrl,
      public_id: faker.string.uuid(),
      height: faker.string.numeric(3),
      width: faker.string.numeric(3),
    },
    sName: faker.company.name().slice(0, 80),
    name: faker.company.name().slice(0, 250),
    studentsNo: faker.number.int({ min: 0, max: 1000 }),
    address: faker.location.streetAddress(),
    images: Array.from({ length: 3 }, () => ({
      blurHash,
      secure_url: defaultSecureUrl,
      public_id: faker.string.uuid(),
      height: faker.string.numeric(3),
      width: faker.string.numeric(3),
    })),
    facilities: ["Library", "Laboratory", "Playground"],
    text1: faker.lorem.paragraphs(2),
    programs: ["Nursery to class 10", "Class 11 to Class 12"],
    principle: {
      image: {
        blurHash,
        secure_url: defaultSecureUrl,
        public_id: faker.string.uuid(),
        height: faker.string.numeric(3),
        width: faker.string.numeric(3),
      },
      quote: "Quality education is our motto",
      name: faker.person.fullName(),
    },
    estd: faker.number.int({ min: 1900, max: 2023 }),
    text2: faker.lorem.paragraph(),
    phone: [faker.number.int({ min: 1000000000, max: 9999999999 })],
    email: [faker.internet.email().toLowerCase()],
    social: {
      facebook: faker.internet.url(),
      twitter: faker.internet.url(),
      instagram: faker.internet.url(),
      youtube: faker.internet.url(),
    },
    coordinates: `${faker.location.latitude()}, ${faker.location.longitude()}`,
    teamText: "Our biggest strength is our dedicated team...",
    text3: faker.lorem.paragraphs(3),
    policies: [
      "Promoting regular attendance for student success.",
      "Creating a safe, respectful environment.",
    ],
    others: [
      {
        tName: "School Vision",
        title: "Our Vision Statement",
        details: "To provide quality education...",
        images: [
          {
            blurHash,
            secure_url: defaultSecureUrl,
            public_id: faker.string.uuid(),
            height: faker.string.numeric(3),
            width: faker.string.numeric(3),
          },
        ],
      },
    ],
    faq: [
      {
        question: "What is the school's mission?",
        answer: "Our mission is to educate and inspire.",
      },
    ],
    ratings: 0,
    noOfReviews: 0,
    reviews: [],
    studentsTaught: faker.number.int({ min: 0, max: 10000 }),
    busFee: [
      {
        location: "Downtown",
        amounts: [
          { date: new Date(), amount: faker.number.int({ min: 50, max: 200 }) },
        ],
        active: true,
      },
    ],
    course: [],
  };
}

function generateFakeStaff(schoolCode) {
  return {
    password: "$2b$10$buVESyzpEJCPVTQtp7jv2ue2BHW9YRjqT296GQPcuydyZtKRBhFvq",
    name: faker.person.fullName(),
    title: faker.person.jobTitle(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.number.int({ min: 1000000000, max: 9999999999 }),
    address: faker.location.streetAddress(),
    qualification: faker.person.jobType(),
    about: faker.lorem.sentence(),
    dob: faker.date.past({ years: 30, refDate: new Date(2000, 0, 1) }),
    gender: faker.helpers.arrayElement(["Male", "Female", "Other"]),
    pPhoto: {
      blurHash,
      secure_url: defaultSecureUrl,
      public_id: faker.string.uuid(),
      height: faker.number.int({ min: 200, max: 1000 }).toString(),
      width: faker.number.int({ min: 200, max: 1000 }).toString(),
    },
    status: "active",
    schoolCode: schoolCode,
    password: faker.internet.password(),
    role: faker.helpers.arrayElement([
      "Administrator",
      "Coordinator",
      "Moderator",
      "Staff",
      "Teacher",
      "Worker",
    ]),
    tokens: [
      {
        device: faker.word.sample(),
        token: faker.string.uuid(),
      },
    ],
  };
}

// Function to generate a student document based on schema
function generateFakeStudent(schoolCode, course) {
  return {
    name: faker.person.fullName(),
    dob: faker.date.birthdate({ min: 5, max: 18, mode: "age" }),
    gender: faker.helpers.arrayElement(["Male", "Female", "Other"]),
    course,
    email: faker.internet.email(),
    phone: faker.number.int({ min: 1000000000, max: 9999999999 }),
    address: faker.location.streetAddress(),
    psName: faker.company.name(),
    psAddress: faker.location.streetAddress(),
    gpa: faker.number.float({ min: 0, max: 4, precision: 0.01 }),

    // Hardcoded photo data
    photo1: {
      blurHash,
      secure_url: defaultSecureUrl,
      public_id: "photo1_public_id",
      width: "800",
      height: "600",
    },
    photo2: {
      blurHash,
      secure_url: defaultSecureUrl,
      public_id: "photo2_public_id",
      width: "800",
      height: "600",
    },
    photo3: {
      blurHash,
      secure_url: defaultSecureUrl,
      public_id: "photo3_public_id",
      width: "800",
      height: "600",
    },
    photo4: {
      blurHash,
      secure_url: defaultSecureUrl,
      public_id: "photo4_public_id",
      width: "800",
      height: "600",
    },

    fName: faker.person.fullName({ gender: "male" }),
    mName: faker.person.fullName({ gender: "female" }),
    phone2: faker.number.int({ min: 1000000000, max: 9999999999 }),
    fProfession: faker.person.jobTitle(),
    mProfession: faker.person.jobTitle(),
    status: "active",
    schoolCode: schoolCode,
    password: faker.internet.password(),
    year: new Date().getFullYear(),
    tokens: [],
    otp: {},
  };
}

const courses = [
  // One
  {
    class: "1",
    seatsAvailable: 999,
    subjects: ["Math", "English", "Nepali"],
    groups: [
      {
        name: "A",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "A",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
      {
        name: "B",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "B",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
    ],
    fees: [
      {
        title: "Registration Fee",
        amount: 100,
      },
      {
        title: "Another Fee",
        amount: 1000,
      },
      {
        title: "Final Fee",
        amount: 9000,
      },
      {
        title: "Medical Fee",
        amount: 6755,
      },
      {
        title: "Joining Fee",
        amount: 1200,
      },
      {
        title: "Moving Fee",
        amount: 1000,
      },
    ],
  },

  // Two
  {
    class: "2",
    seatsAvailable: 999,
    subjects: ["Math", "English", "Nepali"],
    groups: [
      {
        name: "A",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "A",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
      {
        name: "B",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "B",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
    ],
    fees: [
      {
        title: "Registration Fee",
        amount: 100,
      },
      {
        title: "Another Fee",
        amount: 1000,
      },
      {
        title: "Final Fee",
        amount: 9000,
      },
      {
        title: "Medical Fee",
        amount: 6755,
      },
      {
        title: "Joining Fee",
        amount: 1200,
      },
      {
        title: "Moving Fee",
        amount: 1000,
      },
    ],
  },

  // three
  {
    class: "3",
    seatsAvailable: 999,
    subjects: ["Math", "English", "Nepali"],
    groups: [
      {
        name: "A",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "A",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
      {
        name: "B",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "B",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
    ],
    fees: [
      {
        title: "Registration Fee",
        amount: 100,
      },
      {
        title: "Another Fee",
        amount: 1000,
      },
      {
        title: "Final Fee",
        amount: 9000,
      },
      {
        title: "Medical Fee",
        amount: 6755,
      },
      {
        title: "Joining Fee",
        amount: 1200,
      },
      {
        title: "Moving Fee",
        amount: 1000,
      },
    ],
  },

  // Four
  {
    class: "4",
    seatsAvailable: 999,
    subjects: ["Math", "English", "Nepali"],
    groups: [
      {
        name: "A",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "A",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
      {
        name: "B",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "B",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
    ],
    fees: [
      {
        title: "Registration Fee",
        amount: 100,
      },
      {
        title: "Another Fee",
        amount: 1000,
      },
      {
        title: "Final Fee",
        amount: 9000,
      },
      {
        title: "Medical Fee",
        amount: 6755,
      },
      {
        title: "Joining Fee",
        amount: 1200,
      },
      {
        title: "Moving Fee",
        amount: 1000,
      },
    ],
  },

  //five
  {
    class: "5",
    seatsAvailable: 999,
    subjects: ["Math", "English", "Nepali"],
    groups: [
      {
        name: "A",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "A",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
      {
        name: "B",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "B",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
    ],
    fees: [
      {
        title: "Registration Fee",
        amount: 100,
      },
      {
        title: "Another Fee",
        amount: 1000,
      },
      {
        title: "Final Fee",
        amount: 9000,
      },
      {
        title: "Medical Fee",
        amount: 6755,
      },
      {
        title: "Joining Fee",
        amount: 1200,
      },
      {
        title: "Moving Fee",
        amount: 1000,
      },
    ],
  },

  // six
  {
    class: "6",
    seatsAvailable: 999,
    subjects: ["Math", "English", "Nepali"],
    groups: [
      {
        name: "A",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "A",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
      {
        name: "B",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "B",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
    ],
    fees: [
      {
        title: "Registration Fee",
        amount: 100,
      },
      {
        title: "Another Fee",
        amount: 1000,
      },
      {
        title: "Final Fee",
        amount: 9000,
      },
      {
        title: "Medical Fee",
        amount: 6755,
      },
      {
        title: "Joining Fee",
        amount: 1200,
      },
      {
        title: "Moving Fee",
        amount: 1000,
      },
    ],
  },

  //seven
  {
    class: "7",
    seatsAvailable: 999,
    subjects: ["Math", "English", "Nepali"],
    groups: [
      {
        name: "A",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "A",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
      {
        name: "B",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "B",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
    ],
    fees: [
      {
        title: "Registration Fee",
        amount: 100,
      },
      {
        title: "Another Fee",
        amount: 1000,
      },
      {
        title: "Final Fee",
        amount: 9000,
      },
      {
        title: "Medical Fee",
        amount: 6755,
      },
      {
        title: "Joining Fee",
        amount: 1200,
      },
      {
        title: "Moving Fee",
        amount: 1000,
      },
    ],
  },

  // eight
  {
    class: "8",
    seatsAvailable: 999,
    subjects: ["Math", "English", "Nepali"],
    groups: [
      {
        name: "A",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "A",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
      {
        name: "B",
        subjects: ["Math", "English", "Nepali"],
        sections: [
          {
            name: "B",
            subjects: [
              {
                subject: "Math",
              },
              {
                subject: "English",
              },
              {
                subject: "Nepali",
              },
            ],
          },
        ],
      },
    ],
    fees: [
      {
        title: "Registration Fee",
        amount: 100,
      },
      {
        title: "Another Fee",
        amount: 1000,
      },
      {
        title: "Final Fee",
        amount: 9000,
      },
      {
        title: "Medical Fee",
        amount: 6755,
      },
      {
        title: "Joining Fee",
        amount: 1200,
      },
      {
        title: "Moving Fee",
        amount: 1000,
      },
    ],
  },
];

async function doJob() {
  try {
    const createdSchool = await School.create(generateFakeSchoolData());
    const schoolCode = createdSchool.schoolCode;

    await Promise.all([
      new Gallery({ schoolCode }).save(),
      new Account({ schoolCode }).save(),
      new Update({ schoolCode }).save(),
      new Library({ schoolCode, library: [] }).save(),
    ]);

    const company = await Company.findById("6682b2b28051d8ae2f37cb05");
    company.noOfSchools++;
    company.schools.push({
      info: `${schoolCode} ${createdSchool.name} ${createdSchool.sName} ${
        createdSchool.address.split(" ")[0]
      }`,
      schoolCode,
    });
    await company.save();

    const promises = [];
    for (i = 0; i < 20; i++) {
      const staffPromise = Staff.create(
        generateFakeStaff(createdSchool.schoolCode)
      );
      promises.push(staffPromise);
    }

    const createdStaffs = await Promise.all(promises);
    createdSchool.staffs.unshift(...createdStaffs);

    const newCourses = courses.map((course, index) => {
      // Generate a new unique ObjectId for the current course
      const newId = new mongoose.Types.ObjectId(
        `642c2f6b06b7a40e5eabef1${index}`
      );

      // Update the `_id` and `next` fields
      return {
        ...course,
        _id: newId,
        next:
          index === courses.length - 1
            ? null
            : `642c2f6b06b7a40e5eabef1${index + 1}`,
      };
    });

    createdSchool.course = newCourses;

    const newSchool = await createdSchool.save();
    const classes = newSchool.course.map((crc) => crc._id.toString());

    await startNewSession(parseInt(newSchool.schoolCode), classes);

    // writeToFile(school.students);
    console.log(schoolCode);
    console.log("Finally we did this thing so we should be proud");
  } catch (e) {
    console.log(e.message);
    console.log(e);
  }
}

async function addCourses(schoolCode) {
  try {
    const createdSchool = await School.findOne({
      schoolCode: parseInt(schoolCode),
    });


    const newCourses = courses.map((course, index) => {
      // Generate a new unique ObjectId for the current course
      const newId = new mongoose.Types.ObjectId(
        `642c2f6b06b7a40e5eabef1${index}`
      );

      // Update the `_id` and `next` fields
      return {
        ...course,
        _id: newId,
        next:
          index === courses.length - 1
            ? null
            : `642c2f6b06b7a40e5eabef1${index + 1}`,
      };
    });

    createdSchool.course = newCourses;

    const newSchool = await createdSchool.save();
    const classes = newSchool.course.map((crc) => crc._id.toString());

    await startNewSession(parseInt(newSchool.schoolCode), classes);

    console.log("Courses Created Successfully");
  } catch (e) {
    console.log(e.message);
    console.log(e);
  }
}

async function addStaffs(schoolCode) {
  const createdSchool = await School.findOne({
    schoolCode: parseInt(schoolCode),
  });

  const promises = [];
  for (i = 0; i < 20; i++) {
    const staffPromise = Staff.create(generateFakeStaff(schoolCode));
    promises.push(staffPromise);
  }

  const createdStaffs = await Promise.all(promises);
  createdSchool.staffs.unshift(...createdStaffs);
  await createdSchool.save();
  console.log("20 staffs added");
}

async function addStudents(schoolCode) {
  let school = await School.findOne({
    schoolCode: parseInt(schoolCode),
  });

  async function addStudent() {
    for (const crc of school.course) {
      for (const grp of crc.groups) {
        const studentData = generateFakeStudent(school.schoolCode, {
          class: crc._id.toString(),
          group: grp._id.toString(),
        });

        const newStudent = new Student(studentData);
        const createdStudent = await newStudent.save();

        school.admissions.push(createdStudent);
      }
    }
  }

  for (let i = 0; i < 20; i++) {
    console.log("Student Started " + i);
    await addStudent();
    console.log("Student ended " + i);
  }

  await school.save();

  // Fetch school again if necessary
  school = await School.findOne({
    schoolCode: parseInt(schoolCode),
  });

  // Process admissions one by one
  for (const ind of school.admissions) {
    await acceptAdmission(school.schoolCode, ind._id.toString());
  }

  console.log("Done");
}

// doJob();
// addCourses(187460);
// addStudents(187460);
// addStaffs(187460);