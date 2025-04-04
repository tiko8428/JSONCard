// api/app
const express = require("express");
const { User } = require("../mongoDB/schema");
const appApi = express.Router();

// Middleware
appApi.use("/", (req, res, next) => {
  next();
});

appApi.post("/user", async (req, res) => {
  // id_token => user 
  if (!req.body.id_token) {
    res
      .status(400)
      .json({ message: "Bad request please check the input data." });
    return;
  }
  const user = await User.findOne({ id_token: req.body.id_token });
  if (user) {
    res.status(200).json(user);
    return;
  } else {
    try {
      const newUser = new User(req.body);
      await newUser.save();
      res.status(200).json(newUser);
      return;
    } catch (error) {
      res.status(500).json({ message: error.message });
      return;
    }
  }
});

appApi.get("/users", async (req, res) => {
  try {
    const allUser = await User.find();
    res.status(200).json(allUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


appApi.get("/user", async (req, res) => {
  const { key, value } = req.query;
  if (key === "id") {
    try {
      const user = await User.findById(value);
      if (!user) {
        res.status(404).json({ message: "The user does not exist" });
        return;
      } else {
        res.json(JSON.stringify(user));
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else if ((key, value)) {
    try {
      const user = await User.findOne({ [key]: value });
      if (!user) {
        res.status(404).json({ message: "The user does not exist" });
        return;
      } else {
        res.json(JSON.stringify(user));
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res
      .status(400)
      .json({ message: "Bad request please check the input data." });
  }
});

// UPDATE
/**
 * @openapi
 * /api/app/user?id={user_id}:
 *  put:
 *     tags:
 *     - User
 *     summary: Update USER
 *     parameters:
 *      - name: user_id
 *        in: path
 *        description: Update User by ID
 *        required: true
 *     requestBody:
 *         required: true
 *         content:
 *           application/json:
 *              schema:
 *                 $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/CreateUserResponse'
 *       400:
 *         description: Bad request please check the input data.
 *       404:
 *         description: The user does not exist.
 *       500:
 *         description: Server error.
 */

appApi.put("/user", async (req, res) => {
  const { id } = req.query;
  const params = req.body;
  if (id) {
    try {
      const user = await User.findByIdAndUpdate(id, { ...params });
      if (!user) {
        res.status(404).json({ message: "The user does not exist" });
        return;
      } else {
        res.json(JSON.stringify(user));
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res
      .status(400)
      .json({ message: "Bad request please check the input data." });
  }
});

// DELETE

/**
 * @openapi
 * /api/app/user?key={key}&value={value}:
 *  delete:
 *     tags:
 *     - User
 *     summary: DELETE USER
 *     parameters:
 *      - name: key
 *        in: path
 *        description: Get user by KEY name
 *        required: true
 *      - name: value
 *        in: path
 *        description: KEY value
 *        required: true
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/CreateUserResponse'
 *       400:
 *         description: Bad request please check the input data.
 *       404:
 *         description: The user does not exist.
 *       500:
 *         description: Server error.
 */

appApi.delete("/user", async (req, res) => {
  const { key, value } = req.query;
  if (key === "id") {
    try {
      const user = await User.findByIdAndDelete(value);
      if (!user) {
        res.status(404).json({ message: "The user does not exist" });
        return;
      } else {
        res.json(JSON.stringify(user));
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else if ((key, value)) {
    try {
      const user = await User.findOneAndDelete({ [key]: value });
      if (!user) {
        res.status(404).json({ message: "The user does not exist" });
        return;
      } else {
        res.json(JSON.stringify(user));
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res
      .status(400)
      .json({ message: "Bad request please check the input data." });
  }
});

module.exports = appApi;
