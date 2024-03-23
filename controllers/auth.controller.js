const constants = require("../constants.js");
const User = require("../models/users.models.js");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const registerController = asyncHandler(async (req, res) => {
  const { email, userName, fullName, password } = req.body;

  if (!email || !userName || !fullName || !password) {
    res.status(400);
    throw new Error("All fields are required");
  }

  const userExist = await User.findByCredentials(userName, email);

  if (!userExist) {
    const user = new User({
      userName,
      fullName,
      email,
      password,
    });

    const newUser = await user.save();

    return res.status(201).json({ success: true });
  }

  const userNameEmailExist =
    userExist.userName === userName && userExist.email === email;
  const userNameExist = userExist.userName === userName;
  const emailExist = userExist.email === email;

  if (userNameEmailExist) {
    res.status(400);
    throw new Error("User with same email and username already exist.");
  }
  if (emailExist) {
    res.status(400);
    throw new Error("Email already taken. Try another");
  }
  if (userNameExist) {
    res.status(400);
    throw new Error("Username already taken. Try another");
  }
});

const loginController = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    res.status(400);
    throw new Error("All fields are required");
  }
  const userExist = await User.findByUserName(userName);

  if (!userExist) {
    res.status(401);
    throw new Error("Provided username does not exist");
  }
  const verifiedPassword = await userExist.verifyPassword(password);
  console.log({ verifiedPassword });
  if (!verifiedPassword) {
    res.status(401);
    throw new Error("You have entered incorrect password");
  }

  const accessToken = await userExist.generateAccessToken();
  const refreshToken = await userExist.generateRefreshToken();

  res.cookie(constants.COOKIE_NAME, refreshToken, {
    httpOnly: constants.NODE_ENV === "development",
    secure: true,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: "none",
  });

  res.status(200).json({
    success: true,
    userExist,
    accessToken,
    userId: userExist._id,
  });
});

const refreshAccessTokenController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[constants.COOKIE_NAME];

  if (!refreshToken) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  // If a callback is supplied, function acts asynchronously.
  // The callback is called with the decoded payload if the signature is valid and optional expiration, audience, or issuer are valid. If not, it will be called with the error.

  await jwt.verify(
    refreshToken,
    constants.REFRESH_TOKEN_SECRET,
    asyncHandler(async (error, decoded) => {
      if (error) {
        return res.status(403).json(error);
      }
      // we have encoded the user id in the refresh token
      // we will get the user by that id
      const user = await User.findById(decoded.id);
      if (!user) {
        res.status(401);
        throw new Error(
          "REFRESH CONTROLLER || You are making an unauthorized request."
        );
      }

      const accessToken = await user.generateAccessToken();
      console.log("REFRESH CONTROLLER || access token sent");
      return res.status(200).json({ accessToken, userId: user._id });
    })
  );
});

const resetPasswordController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [user] = await User.find({ email });
  if (!user) {
    res.status(404);
    throw new Error("Email not found.");
  }

  user.password = password;

  const updatedUser = await user.save();

  res.status(200).json({ msg: "Password changed successfully", success: true });
});

const logoutController = asyncHandler(async (req, res) => {
  res.cookie(constants.COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    expires: new Date(0),
    sameSite: "none",
  });
  res.status(200).json("User logged out successfully");
});

module.exports = {
  registerController,
  loginController,
  logoutController,
  refreshAccessTokenController,
  resetPasswordController,
};
