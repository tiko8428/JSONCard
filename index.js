const express = require("express");
const path = require("path");

const cors = require("cors");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const url = require("url");

const vision = require("@google-cloud/vision");
const fileUpload = require("express-fileupload");
const apiRouter = require("./router/apiRouter.js") 

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


app.use("/api",apiRouter);

app.use(express.static(path.join(__dirname, './client/build')));

app.listen("3000", () => {
  // "192.168.1.108",
  console.log(`Example app listening \n`);
  // console.log("http:/192.168.1.108:3000");
});


