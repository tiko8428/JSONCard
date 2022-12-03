const express = require("express");
const { users } = require("../constants");
const adminRoutes = require("./adminRouter");
const {readJsonFile,saveJson, readAdminsJson, userError} = require("../helper");

const apiRoutes = express.Router();

apiRoutes.use("/admin",adminRoutes); 

apiRoutes.get("/allJson", (req, res) => {
  const query = req.query;
  res.json({ query: "query" });
})



apiRoutes.get("/login", (req, res) => {
  const { name, pass } = req.query;
  if (name && pass) {
    const currentUser = users.find((user) => user.name === name);
    if (currentUser) {
      console.log(currentUser)
      res.json(currentUser);
    } else {
      userError(res, "can't find user");
    }
  } else {
    userError(res, "pleas feel userName and pass");
  }
})


module.exports = apiRoutes;
