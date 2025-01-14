require('dotenv').config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const url = require("url");
const fileUpload = require("express-fileupload");
const vision = require("@google-cloud/vision");
const apiRouter = require("./router/apiRouter.js");
// const connectMongo = require("./mongoDB/connect");

const app = express();
app.use(cors());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

app.use(
  bodyParser.json({ limit: "50mb", type: "application/json", extended: true })
);

app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

app.use("/api", apiRouter);

// app.use(express.static(path.join(__dirname, "./client/build")));

app.use(express.static(path.join(__dirname, 'static')));

app.use('/admin', express.static(path.join(__dirname, './client/build')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "static", "index.html"));
})

app.get("/privacy-policy", (req, res) => {
  res.sendFile(path.join(__dirname, "static", "privacy-policy.html"));
})

app.listen("3000", () => {
  // connectMongo();
  console.log(`Example app listening \n on port 3000!`);
  // console.log("http:/192.168.1.108:3000");
});
