const express = require("express");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config({ path: "./config/config.env" });

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Setting up CORS
const corsOptions = {
  origin: [
    process.env.ORIGIN1,
    process.env.ORIGIN2,
    process.env.ORIGIN3,
    process.env.ORIGIN4,
    process.env.ORIGIN5,
    process.env.ORIGIN6,
  ],
  credentials: true,
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

// Imports
const connectDb = require("./config/database");
const scholibRoute = require("./routes/scholibRoute");
const basicRoutes = require("./routes/basicRoutes");
const adminRoute = require("./routes/adminRoute");
const mutualRoute = require("./routes/mutualRoute");
const staffRoute = require("./routes/staffRoute");
const studentRoute = require("./routes/studentRoutes");

const adminStudentRoute = require("./routes/adminForStudentRoute");
const path = require("path");

// All Configs

// Database Connection
connectDb(process.env.DB_URI);

// Routes Usage
app.use("/mutual", mutualRoute);
app.use("/scholib", scholibRoute);
app.use("/basic", basicRoutes);
app.use("/student", studentRoute);
app.use("/staff", staffRoute);
app.use("/admin", adminRoute);

app.use("/adminStudent", adminStudentRoute);

const filePath = path.join(
  __dirname,
  "loaderio-acc2036f0f9a1562a11216c2320953da.txt"
);

app.get("/loaderio-acc2036f0f9a1562a11216c2320953da", (req, res) => {
  // Read the .txt file using the relative path
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error reading file.");
    }
    // Send the file content as the response
    res.send(data);
  });
});

// 404 Handler
app.all("*", (req, res) => {
  res.status(404).send({
    success: false,
    status: "Not Found",
    message: "The resource you are looking for is not available OKAY",
  });
});

app.listen(3001, () => {
  console.log("Server is running on port", 3001);
});
