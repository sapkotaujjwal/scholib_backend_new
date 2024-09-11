const mongoose = require("mongoose");
const { getDate } = require("../config/nepaliDate");

const staffSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  name: { type: String },
  role: { type: String },
  title: { type: String },
  qualification: { type: String },
  pPhoto: {
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
  removedOn: { type: Date },
});

const StudentSchemaNew = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  course: {
    class: { type: mongoose.Schema.Types.ObjectId, ref: "CourseNew" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "groupNew" },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "sectionNew" },
  },
  roll: {
    type: String,
    // required: true,
  },
  status: {
    type: String,
    default: "active", // or another default value
  },
  loginId: {
    type: Number,
    minlength: 6,
    maxlength: 6,
    immutable: true,
    unique: true,
    required: true,
    sparse: true, // This allows multiple null values
  },
  oldCourses: [
    {
      class: { type: mongoose.Schema.Types.ObjectId, ref: "CourseNew" },
      group: { type: mongoose.Schema.Types.ObjectId, ref: "groupNew" },
      section: { type: mongoose.Schema.Types.ObjectId, ref: "sectionNew" },
    },
  ],
});

const schoolSchema = new mongoose.Schema({
  // Schools General data
  logo: {
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
  sName: {
    type: String,
    require: [true, "Provide a school short name in one word eg. KESS"],
    trim: true,
    minlength: [2, "Short Name should be at least of two characters"],
    maxlength: [80, "Short Name cannot excedd 80 characters"],
  },
  name: {
    type: String,
    required: [true, "School Name is required"],
    trim: true,
    minlength: [2, "School Name should be at least of two characters"],
    maxlength: [250, "School Name cannot excedd 250 characters"],
  },
  studentsNo: {
    type: Number,
    default: 0,
  },
  address: {
    type: String,
    trim: true,
    required: true,
    minlength: 2,
    maxlength: [280, "Address cannot exceed 280 characters"],
  },
  images: [
    {
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
  ],
  facilities: {
    type: [String],
    trim: true,
    validate: [
      {
        validator: function (arr) {
          return arr.every(
            (facility) => facility.length >= 2 && facility.length <= 80
          );
        },
        message: "Facilities should be between 2 and 40 characters long",
      },
    ],
  },
  text1: {
    type: String,
    trim: true,
    // minlength: 2,
    maxlength: 1800,
    default:
      "Welcome to Our School, a place of learning, inspiration, and community. At Our School, we believe that education is the cornerstone of a bright future. Our dedicated faculty and staff work tirelessly to create an environment where students can excel academically and grow personally.We offer a comprehensive curriculum that caters to all students, from our young learners to our high school seniors. Our programs are designed to ignite curiosity, foster creativity, and develop critical thinking skills. We encourage a love of learning that lasts a lifetime.Beyond academics, Our School is committed to nurturing well-rounded individuals. Our extensive extracurricular activities, including sports, arts, and clubs, provide opportunities for students to explore their passions and develop leadership skills.Safety is a top priority at Our School. We maintain a secure and welcoming campus, ensuring that your child's well-being is our foremost concern. Our advanced facilities are equipped with the latest technology to support innovative teaching and learning.We also believe in giving back. Our community service initiatives instill a sense of social responsibility in our students. Together, we make a difference in the lives of those in need.Our School is more than a school; it's a family. We foster a strong sense of belonging and support for each student. Our alumni continue to succeed in their careers and contribute positively to their communities.Thank you for considering Our School for your child's education. Explore our website to learn more about our programs, faculty, and the exceptional experiences we offer. Schedule a visit to experience our vibrant community firsthand. Together, we can help your child achieve their dreams.",
  },
  programs: {
    type: [String],
    trim: true,
    default: ["Nursery to class 10"],
    validate: [
      {
        validator: function (arr) {
          return arr.every(
            (program) => program.length >= 2 && program.length <= 40
          );
        },
        message: "Programs should be between 2 and 40 characters long",
      },
    ],
  },
  principle: {
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
    quote: {
      type: String,
      minlength: 2,
      maxlength: 120,
      default: "Quality education is our motto",
    },
    name: {
      type: String,
      trim: true,
      minlength: [2, "Principle Name should be at least of two characters"],
      maxlength: [250, "Principle Name cannot excedd 250 characters"],
    },
  },
  estd: {
    type: Number,
    required: true,
  },
  text2: {
    type: String,
    trim: true,
    // minlength: 2,
    maxlength: 600,
    default: `Since our inception, Our School has been dedicated to delivering an exceptional education. With a rich history of nurturing young minds and fostering a spirit of curiosity, we've continually evolved to meet the changing needs of our students. Our commitment to providing a world-class education remains as strong today as it was on the day we opened our doors. We're proud of the countless achievements of our alumni and the positive impact they've made in their communities. As we look to the future, we are excited to continue our mission of shaping the leaders of tomorrow.`,
  },
  phone: [
    {
      type: Number,
      required: true,
      minlength: 10,
      maxlength: 10,
    },
  ],
  email: [
    {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Invalid email address",
      },
    },
  ],

  social: {
    facebook: {
      type: String,
    },
    twitter: {
      type: String,
    },
    instagram: {
      type: String,
    },
    youtube: {
      type: String,
    },
  },
  coordinates: {
    type: String,
    trim: true,
    minlength: 2,
    maxlength: [120, "Coordinates cannot exceed 120 characters"],
  },
  teamText: {
    type: String,
    trim: true,
    // minlength: 2,
    maxlength: 200,
    default:
      "Our biggest strength are the people who are working their level best to make us to the top and serve the lives aroung us who are responsibke for all of our success and growth days ",
  },
  text3: {
    type: String,
    trim: true,
    // minlength: 2,
    maxlength: 2000,
    default:
      "we believe in the extraordinary potential that resides within each and every student. Our commitment is to nurture that potential and empower you to reach your highest aspirationIn your journey through education, remember that self-belief is your most valuable asset. You are capable of achieving great things, and the first step is to believe in yourself. Let that belief be the driving force behind your actions.Challenges are not roadblocks but stepping stones to success. When you encounter obstacles, view them as opportunities to learn and grow. The path to your dreams may not always be smooth, but it's the bumps and detours that make your journey unique and rewarding.Dreaming big is not only encouraged but celebrated here. Your dreams are the compass that guides you toward your goals. Set your sights high, for you have the potential to achieve more than you can imagine.In your pursuit of excellence, remember that success is a product of hard work. There's no shortcut to achieving your goals. Every effort you put in today is an investment in your future.Resilience is a quality we hold in high regard. It's not about avoiding failure, but about rising stronger after each setback. The most successful individuals in history faced adversity and used it as a stepping stone to greatness.Perseverance is a key to unlocking your potential. Don't give up when faced with challenges. Keep pushing forward, even when the path seems difficult. In the end, your dedication will be your greatest reward. we celebrate the power of teamwork. Together, we achieve more. Support one another, collaborate, and lift each other up. Your peers are valuable allies on your journey to success.We are here to support, guide, and inspire you. Your journey is unique, and we are excited to be a part of it. As you navigate the path of learning, know that the possibilities are endless, and your potential is limitless. Your success story starts here",
  },
  policies: {
    type: [String],
    trim: true,
    default: [
      "Promoting regular attendance for student success.",
      "Defining expected behavior and consequences.",
      "Creating a safe, respectful environment.",
      "Setting dress expectations and guidelines.",
      "Explaining grading and assessment methods.",
      "Establishing homework and assignment standards.",
      "Maintaining discipline and behavior expectations.",
      "Ensuring health and safety guidelines.",
      "Regulating participation in extracurricular activities.",
      "Protecting privacy and personal data.",
      "Encouraging parent-teacher collaboration.",
      "Detailing admissions and enrollment procedures.",
    ],
    validate: [
      {
        validator: function (arr) {
          return arr.every(
            (policy) => policy.length >= 3 && policy.length <= 200
          );
        },
        message: "Each Policy should be between 3 and 200 characters long",
      },
    ],
  },

  others: [
    {
      tName: {
        type: String,
        trim: true,
        required: true,
      },
      title: {
        type: String,
        trim: true,
        required: true,
      },
      details: {
        type: String,
        trim: true,
        required: true,
      },
      images: [
        {
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
      ],
    },
  ],

  faq: [
    {
      question: {
        type: String,
        trim: true,
        minlength: 5,
        maxlength: 200,
      },
      answer: {
        type: String,
        trim: true,
        minlength: 5,
        maxlength: 200,
      },
    },
  ],

  ratings: {
    type: Number,
    default: 0,
  },
  noOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      date: {
        type: Date,
        default: function () {
          const date = getDate();
          return date.fullDate;
        },
      },
      rating: {
        type: Number,
        default: 0,
      },
      name: {
        type: String,
      },
      message: {
        type: String,
        trim: true,
        maxlength: 1250,
      },
      _id: {
        type: String,
      },
    },
  ],
  studentsTaught: {
    type: Number,
    default: 0,
  },

  //bus Fees
  busFee: [
    {
      location: {
        type: String,
        minlength: 2,
        maxlength: 120,
      },
      amounts: [
        {
          date: {
            type: Date,
          },
          amount: {
            type: Number,
            min: 0,
          },
        },
      ],
      active: {
        type: Boolean,
        default: true,
      },
    },
  ],

  //course

  course: [
    {
      class: {
        type: String,
        required: true,
        maxlength: 50,
      },
      seatsAvailable: {
        type: Number,
        required: true,
        default: 999,
      },
      subjects: [
        {
          type: String,
        },
      ],
      groups: [
        {
          name: {
            type: String,
          },
          subjects: [
            {
              type: String,
            },
          ],
          sections: [
            {
              name: {
                type: String,
              },
              subjects: [
                {
                  subject: {
                    type: String,
                  },
                  teacher: {
                    _id: {
                      type: mongoose.Schema.Types.ObjectId,
                      ref: "Staff",
                    },
                    name: {
                      type: String,
                    },
                    title: {
                      type: String,
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      fees: [
        {
          title: {
            type: String,
          },
          amount: {
            type: Number,
            min: 0,
          },
        },
      ],
      next: {
        type: String,
      },
    },
  ],

  course2: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseNew" }],
  olderData: [{ type: mongoose.Schema.Types.ObjectId, ref: "OlderData" }],

  // from other Schemas
  staffs: [staffSchema],
  students: [StudentSchemaNew],

  admissions: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
      name: {
        type: String,
      },
      course: {
        class: {
          type: String,
        },
        group: {
          type: String,
        },
      },
      photo1: {
        blurHash: {
          type: String,
        },
        secure_url: {
          type: String,
        },
        public_id: {
          type: String,
        },
        width: {
          type: String,
        },
        height: {
          type: String,
        },
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate: {
          validator: function (value) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          },
          message: "Invalid email address",
        },
      },
      phone: {
        type: Number,
        required: true,
        minlength: 10,
        maxlength: 10,
      },
      gpa: {
        type: Number,
        min: 0,
        max: 4,
      },
    },
  ],

  //scholib data
  schoolCode: {
    type: Number,
    unique: true,
    minlength: 6,
    maxlength: 6,
    immutable: true,
  },
});

// Pre-save hook
schoolSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Only generate code during creation
    let uniqueCode = await generateUniqueCode(this.constructor);
    this.schoolCode = uniqueCode;
  }
  next();
});

// Method to generate a unique 6-digit code
async function generateUniqueCode(model) {
  while (true) {
    const num = Math.floor(100000 + Math.random() * 900000).toString();
    const code = parseInt(num);
    const existingSchool = await model.findOne({ schoolCode: code });
    if (!existingSchool) {
      return code;
    }
  }
}

const olderDataSchema = new mongoose.Schema({
  year: {
    type: Number,
    default: getDate().year,
  },
  schoolCode: {
    type: Number,
    ref: "School",
    required: true,
  },
  students: [StudentSchemaNew],
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseNew" }],
});

const School = mongoose.model("school", schoolSchema);
const OlderData = mongoose.model("olderData", olderDataSchema);

module.exports = { School, OlderData };
