const express = require("express");
const { users } = require("../constants");

const userError = (res, msg) => {
    res.status(404);
    res.send({ error: msg })
}


const apiRoutes = express.Router();

apiRoutes.use((req, res, next) => {
    console.log("tiko");
    next();
})

apiRoutes.get("/allJson", (req, res) => {
    const query = req.query;
    res.json({ query: "query" });
})

apiRoutes.get("login", (req, res) => {
    const { name, pass } = req.query;
    if (name && pass) {
        const currentUser = users.find((user) => user.name === name);
        res.json(currentUser);
    } else {
        userError("can't find user");
    }
})


module.exports = apiRoutes;
