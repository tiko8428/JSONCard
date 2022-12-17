const express = require("express");
const { readJsonFile, saveJson, readUsersJson, userError } = require("../helper");

const userRouter = express.Router();

userRouter.use("/", (req, res, next) => {
  // check login
  next();
});

userRouter.get("/jsonData", (req, res) => {
  const { laval, language } = req.query
  const currentJSonData = readJsonFile(laval, language);
  // if  currentJSonData empty;
  res.json(currentJSonData);
})

userRouter.post("/create-item", (req, res) => {
  const { laval, language, data } = req.body.body
  const currentJSonData = readJsonFile(laval, language);
  if (!currentJSonData) {
    userError(res, "json save error");
    return
  }
  const newData = { ...currentJSonData, [data.cardNumber]: data }
  saveJson(laval, language, newData);
  res.send("ok");
})

module.exports = userRouter;

