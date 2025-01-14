const express = require("express");
const { users, adminUser } = require("../constants");
const adminRoutes = require("./adminRouter");
const userRouter = require("./userRouter");
const appApi = require("./appApi");
const feedRouter = require("./feedRouter");
const { readUsersJson, userError } = require("../helper");

const apiRoutes = express.Router();

apiRoutes.use("/admin", adminRoutes);
apiRoutes.use("/user", userRouter);
apiRoutes.use("/app", appApi);
apiRoutes.use("/feed", feedRouter);

/**
 * @openapi
 * /api/healthcheck:
 *  get:
 *     tags:
 *     - Healthcheck
 *     description: Responds if the app is up and running
 *     responses:
 *       200:
 *         description: App is up and running
 */
apiRoutes.get("/healthcheck", (req, res) => res.sendStatus(200));

apiRoutes.get("/login", (req, res) => {
  const { name, pass } = req.query;
  if (name && pass) {
    let currentUser = {};
    if (name === adminUser.name) {
      currentUser = adminUser;
    } else {
      const userList = readUsersJson();
      currentUser = userList.find((user) => user.name === name);
    }
    if (currentUser) {
      if (currentUser.name === name && currentUser.pass === pass) {
        res.json(currentUser);
      } else {
        userError(res, "User name or password is wrong");
      }
    } else {
      userError(res, "can't find user");
    }
  } else {
    userError(res, "pleas feel userName and pass");
  }
});

module.exports = apiRoutes;
