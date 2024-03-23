const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const constants = require("../constants");

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      default: "",
    },
    fullName: {
      type: String,
      required: true,
      default: "",
    },
    // name: {
    //   type: String,
    //   required: true,
    //   default: "",
    // },
    email: {
      type: String,
      required: true,
      default: "",
    },
    password: {
      type: String,
      required: true,
      default: "",
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tweets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet",
      },
    ],
    savedTweets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet",
      },
    ],
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret, options) {
    delete ret.password;
    delete ret.id;
    return ret;
  },
});

userSchema.pre("save", async function (next) {
  try {
    const user = this;

    if (!user.isModified("password")) {
      return next();
    }

    user.password = await bcrypt.hash(user.password, 10);
  } catch (error) {
    console.log(error);
  }
});

userSchema.statics.findByCredentials = async function (
  userName = "",
  email = ""
) {
  try {
    const user = await userModel.findOne({
      $or: [{ userName }, { email }],
    });

    return user;
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
};

userSchema.statics.findByUserName = async (userName = "") => {
  try {
    const user = await userModel
      .findOne({
        $or: [{ userName }, { email: userName }],
      })
      .populate([
        { path: "tweets", select: "content userName likedBy" },
        { path: "followers", select: "-savedTweets -email" },
        { path: "followings", select: "-savedTweets -email" },
      ])
      .select("-savedTweets -email");

    return user;
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
};

userSchema.methods.generateAccessToken = async function () {
  const payload = {
    id: this._id,
    userName: this.userName,
    email: this.email,
  };

  const accessToken = await jwt.sign(payload, constants.ACCESS_TOKEN_SECRET, {
    expiresIn: constants.ACCESS_TOKEN_EXPIRY,
  });

  return accessToken;
};

userSchema.methods.generateRefreshToken = async function () {
  const payload = {
    id: this._id,
  };

  const accessToken = await jwt.sign(payload, constants.REFRESH_TOKEN_SECRET, {
    expiresIn: constants.REFRESH_TOKEN_EXPIRY,
  });

  return accessToken;
};

userSchema.methods.verifyPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel = mongoose.model("User", userSchema);
module.exports = mongoose.model("User", userSchema);
