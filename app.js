const express = require("express");
const cors = require("cors");
const User = require("./models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { initialize } = require("passport");
const saltRounds = 10;
require("./config/database");
require("dotenv").config();
const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());

require("./config/passport");

//register route
app.post("/register", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user) return res.status(400).send("User already exits");

    bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
      const newUser = new User({
        username: req.body.username,
        password: hash,
      });

      await newUser
        .save()
        .then((user) => {
          res.send({
            success: true,
            message: "User is created successfully",
            user: {
              id: user._id,
              username: user.username,
            },
          });
        })
        .catch((error) => {
          res.send({
            success: false,
            message: "User is not created",
            error: error.message,
          });
        });
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

//login route
app.post("/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) {
    return res.status(401).send({
      success: false,
      message: "User is not found",
    });
  }

  if (!bcrypt.compareSync(req.body.password, user.password)) {
    return res.status(401).send({
      success: false,
      message: "Incorrect password",
    });
  }

  const payload = {
    id: user._id,
    username: user.username,
  };
  const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "2d" });
  return res.status(200).send({
    success: true,
    message: "User is logged in successfully",
    token: "Bearer " + token,
  });
});

//profile route
app.get("/profile", (req, res) => {
  res.status(200).send("<h1>Welcome to the Profile</h1>");
});

//base route
app.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  function (req, res) {
    res.status(200).send({
      success: true,
      user: {
        id: req.user._id,
        username: req.body.username,
      },
    });
  }
);

//resource error
app.get((req, res, next) => {
  res.status(404).send("Route no found");
});

//server  error
app.get((err, req, res, next) => {
  res.status(500).send("Something broke");
});

module.exports = app;
