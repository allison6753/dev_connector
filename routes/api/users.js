const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator/check");

const User = require("../../models/User");

//@route    POST api/users
//@desc     Register route
//@access   Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    //async before a function means function returns a promise
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      //see if user exists using async await
      let user = await User.findOne({ email });

      if (user) {
        // matching error type (array) to error type above
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }

      // Get users gravitar (based on email)
      const avatar = gravatar.url(email, {
        s: "200", //default size
        r: "pg", //rating
        d: "mm", //default
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      // Encript password using bcrypt
      const salt = await bcrypt.genSalt(10); //await makes JS wait until promise settles and then returns that promise here we are using 10 rounds, which is recommended in genSalt() documentation

      user.password = await bcrypt.hash(password, salt); //hashing password and saving to user.password

      await user.save();

      //return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
