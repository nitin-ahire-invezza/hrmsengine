require("dotenv").config();
const startJobs = require("./Jobs/start");
const mongoose = require("mongoose");
mongoose.connect(process.env.DB_CONNECT);

let ejs = require("ejs");

const port = 4000;

const express = require("express");
const cors = require("cors");
const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");

const allowedOrigins = [
  "http://192.168.1.37:5173",
  "http://localhost:5173",
  "http://172.30.32.1:5173",
  "https://invezzahrms.shub.space",
  "https://engineinv.vercel.app",
  "https://www.hrmsdev.invezzatech.com",
  "https://hrmsdev.invezzatech.com",
  "/*",
];

const corsOptions = {
  origin: allowedOrigins,
  methodS: "GET, POST, PUT, DELETE, PATCH, HEAD",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use(express.static("public"));

// Add this route for the root path
app.get("/", (req, res) => {
  res.render("index");
});

//admin routes
const adminRoute = require("./routes/adminRoute");
app.use("/api/admin", adminRoute);

//main emp loging routes
const authRoute = require("./routes/authRoute");
app.use("/api", authRoute);

//common routes
const commonRoute = require("./routes/commonRoute");
app.use("/api", commonRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server is works on port http://localhost:${process.env.PORT}`);
  startJobs();
});
