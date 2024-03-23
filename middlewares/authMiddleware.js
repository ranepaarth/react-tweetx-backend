const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/users.models");
const constants = require("../constants");

const authMiddleware = asyncHandler(async (req, res, next) => {
  try {
    const headers = req.headers.authorization || req.headers["Authorization"];

    console.log(
      "---------------------AUTH MIDDLEWARE START--------------------"
    );


    if (!headers) {
      res.status(403);
      throw new Error("Please login to continue");
    }


    const accessToken = headers.split(" ")[1];

    if (!accessToken) {
      res.status(403);
      throw new Error("Please login to continue");
    }

    const user = jwt.verify(accessToken, constants.ACCESS_TOKEN_SECRET);

    if (!user) {
      res.status(403);
      throw new Error(
        "AUTH MIDDLEWARE ERROR || You are not authorized to make requests"
      );
    }

    req.user = user;

    next();
  } catch (error) {
    const expParams = {
      error: "expired_access_token",
      error_description: "access token expired",
    };

    if (error.name === "TokenExpiredError") {
      res.status(403).json(expParams);
      throw new Error("Authentication error, token lifetime exceeded");
    }
  }
});

module.exports = { authMiddleware };
