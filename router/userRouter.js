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
  setTimeout(() => {
    res.json(JSON.stringify(currentJSonData));
  }, 0)
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

userRouter.get("/by-card-number", (req, res) => {
  const { laval, language, cardNumber } = req.query;
  const currentJSonData = readJsonFile(laval, language);
  const currentRow = currentJSonData[cardNumber];
  if (currentRow) {
    res.json(JSON.stringify(currentRow))
  } else {
    res.json(JSON.stringify({}))
  }
})

userRouter.put("/translate", (req, res)=>{
  const { laval, language, values } = req.body.body;
  const currentJSonData = readJsonFile(laval, language);
  currentJSonData[values.cardNumber] = values;
  saveJson(laval, language, currentJSonData);
  res.send("ok")  
})

userRouter.put("/edit", (req, res)=>{
  const { laval, language, values, originCardNumber } = req.body.body;
  const currentJSonData = readJsonFile(laval, language);
  delete currentJSonData[originCardNumber];

  currentJSonData[values.cardNumber] = values;
  saveJson(laval, language, currentJSonData);
  res.send("ok") 
})

module.exports = userRouter;

