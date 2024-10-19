const express = require("express");
const https = require("https");
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

// All Configs

// Database Connection

connectDb(process.env.DB_URI);
// connectDb();

// Routes Usage
app.use("/mutual", mutualRoute);
app.use("/scholib", scholibRoute);
app.use("/basic", basicRoutes);
app.use("/student", studentRoute);
app.use("/staff", staffRoute);
app.use("/admin", adminRoute);

app.use("/adminStudent", adminStudentRoute);

// 404 Handler
app.all("*", (req, res) => {
  res.status(404).send({
    success: false,
    status: "Not Found",
    message: "The resource you are looking for is not available",
  });
});

// HTTPS Server
const credentials = {
  key: fs.readFileSync("./test/server.key"),
  cert: fs.readFileSync("./test/server.cert"), // or server.pem
};

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(process.env.PORT || 3000, () => {
  console.log("HTTPS Server is running on port", process.env.PORT || 3000);
});
