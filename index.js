require('dotenv').config();
require("./instrument.js");
const Sentry = require("@sentry/node");
const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const apiRouter = require("./router/apiRouter.js");
// const connectMongo = require("./mongoDB/connect");


const app = express();
const PORT = process.env.NODE_ENV === "production"
  ? process.env.PORT_PRODUCTION || 3000
  : process.env.PORT_DEVELOPMENT || 8000;


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

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});


if (process.env.NODE_ENV === 'production') {
  Sentry.setupExpressErrorHandler(app);
  // Optional fallthrough error handler
  app.use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + "\n");
  }); 
}

app.listen(PORT, () => {
  // connectMongo();
  console.log(`Example app listening on port ${PORT}`);
  // console.log("http:/192.168.1.108:3000");
});
