const express = require("express");
const { users } = require("../constants");
const { readJsonFile, saveJson, readUsersJson, userError, saveUserJson } = require("../helper");
const uuid = require("uuid");

const adminRoutes = express.Router();

const adminUser = {
  "name": "karen",
  "pass": "karen",
  "key": "testKey",
  "rol": "admin"
};

adminRoutes.use("/", (req, res, next) => {
  const { adminKey } = req.query;
  if (adminUser.key === adminKey) {
    next();
  } else {
    userError(res, "YOU are not ADMIN");
  }
});

adminRoutes.get("/users", (req, res) => {
  const users = readUsersJson();
  if (users) {
    res.json(users)
  } else {
    userError(res, "can't find user List");
  }
});

adminRoutes.post("/create-user", (req, res) => {
  const item = req.body.body;
  const newUser = {
    ...item,
    key: uuid.v4()
  }
  const users = readUsersJson();
  if (users) {
    const newUsers = [
      ...users,
      newUser
    ]
    saveUserJson(newUsers);
    res.json(newUsers)
  } else {
    userError(res, "can't find user List");
  }
});

adminRoutes.delete("/delete-user", (req, res) => {
  console.log(req.query.key);
  const userKey = req.query.key;
  const users = readUsersJson();
  
  if (users) {
    const filteredPeople = users.filter((item) => item.key !== userKey);
    saveUserJson(filteredPeople);
    res.json(filteredPeople)
  } else {
    userError(res, "can't find user List");
  }
});
module.exports = adminRoutes;
