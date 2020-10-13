const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  // Get token from the header
  const token = req.header("x-auth-token");

  //check if not token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" }); //401 means not authorized
  }

  //verify token if there is one
  try {
    const decoded = jwt.verify(token, config.get("jwtSecret")); //.verify() decodes token

    req.user = decoded.user;
    next();
  } catch (err) {
    //catch if token is not valid
    res.status(401).json({ msg: "Token is not valid" });
  }
};
