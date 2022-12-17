const express = require("express");
const uuid = require("uuid");
const path = require("path");
const { readJsonFile, saveJson, readUsersJson, userError, saveUserJson } = require("../helper");
const { adminUser } = require("../constants");

const adminRoutes = express.Router();



adminRoutes.use("/", (req, res, next) => {
  const { adminKey } = req.query;
  if (adminUser.key === adminKey) {
    next();
  } else {
    console.log("YOU are not ADMIN");
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
  const { deleteUser } = req.query;
  const users = readUsersJson();
  if (users) {
    const filteredPeople = users.filter((item) => item.key !== deleteUser);
    saveUserJson(filteredPeople);
    res.json(filteredPeople)
  } else {
    userError(res, "can't find user List");
  }
});

adminRoutes.delete("/delete-item", (req, res) => {
  const { itemKey, lang, laval } = req.query;

  const users = readJsonFile(laval, lang);
  if (users) {
    const filteredPeople = users.filter((item) => item.key !== itemKey);
    saveUserJson(filteredPeople);
    res.json(filteredPeople)
  } else {
    userError(res, "can't find user List");
  }
});

adminRoutes.get("/download", (req, res) => {
  const { language, laval } = req.query;
  const filePhat = path.join(__dirname, `../json_db/${laval}_${language}.json`);
  if (filePhat) {
    res.download(filePhat);
  } else {
    userError(res, "can't find file");
  }
});

module.exports = adminRoutes;
