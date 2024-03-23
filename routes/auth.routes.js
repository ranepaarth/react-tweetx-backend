const express = require("express");
const {
  loginController,
  registerController,
  logoutController,
  refreshAccessTokenController,
  resetPasswordController,
} = require("../controllers/auth.controller");

const authRouter = express.Router();

authRouter.route("/login").post(loginController);
authRouter.route("/register").post(registerController);
authRouter.route("/logout").post(logoutController);
authRouter.route("/refresh").get(refreshAccessTokenController);
authRouter.route("/reset").patch(resetPasswordController);

module.exports = { authRouter };
