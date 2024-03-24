const asyncHandler = require("express-async-handler");
const User = require("../models/users.models.js");
const { default: mongoose } = require("mongoose");

const getAllUsersController = asyncHandler(async (req, res) => {
  try {
    const users = await User.find(
      {},
      {
        _id: 1,
        userName: 1,
        fullName: 1,
        followersCount: { $size: "$followers" },
        followingsCount: { $size: "$followings" },
        tweetsCount: { $size: "$tweets" },
      }
    );

    if (!users) {
      res.status(404);
      throw new Error("No Users found");
    }

    res.status(200).json(users);
  } catch (error) {
    console.log(error);
  }
});

const getCurrUserProfileController = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId)
    .select("-email")
    .populate([
      { path: "followers", select: "-savedTweets -email" },
      { path: "followings", select: "-savedTweets -email" },
      {
        path: "tweets",
        select: "userName content likedBy createdAt updatedAt",
        options: { sort: { createdAt: -1 } },
      },
    ]);

  if (!user) {
    res.status(404);
    throw new Error("Profile not found.");
  }

  res.status(200).json(user);
});

const getUserByIdController = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error(`User with that id:${userId} not found`);
  }

  User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $project: {
        _id: 1,
        userName: 1,
        followersCount: { $size: "$followers" },
        followingCount: { $size: "$followings" },
        tweetsCount: { $size: "$tweets" },
      },
    },
  ])
    .then((result) => {
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(result[0]); // Assuming there's only one user with the given ID
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    });
});

const getUserByNameController = asyncHandler(async (req, res) => {
  const userName = req.params.userName;

  const user = await User.findByUserName(userName);

  if (!user) {
    res.status(404);
    throw new Error(`${userName} user not found.`);
  }

  res.status(200).json(user);
});

const followUserController = asyncHandler(async (req, res) => {
  const currUserId = req.user.id;
  const { userId } = req.body;

  const userToFollow = await User.findById(userId);

  // already following the user, Therefore unfollow the user
  if (userToFollow.followers.includes(currUserId)) {
    await User.findByIdAndUpdate(currUserId, {
      $pull: { followings: userId },
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { followers: currUserId },
    });
    return res
      .status(200)
      .json({ message: "You have unfollowed the user", isFollowing: true });
  }

  // Follow the user
  await User.findByIdAndUpdate(currUserId, {
    $addToSet: { followings: userId },
  });

  await User.findByIdAndUpdate(userId, {
    $addToSet: { followers: currUserId },
  });

  return res
    .status(200)
    .json({ message: "You are now following the user", isFollowing: false });
});

const deleteUserController = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const deletedUser = await User.findByIdAndDelete(userId);

  if (!deletedUser) {
    res.status(404);
    throw new Error("User does not exist");
  }

  res.status(200).json(deletedUser);
});

const searchUserByNameController = asyncHandler(async (req, res) => {
  console.log(
    "----------------------SEARCH USER BY NAME CONTROLLER---------------------"
  );
  const userName = new RegExp(req.params?.userName, "i");

  if (userName != "") {
    try {
      const searchResults = await User.find(
        { $or: [{ userName }, { fullName: userName }] },
        {
          _id: 1,
          userName: 1,
          fullName: 1,
          followersCount: { $size: "$followers" },
          followingsCount: { $size: "$followings" },
          tweetsCount: { $size: "$tweets" },
        }
      );
      return res.status(200).json(searchResults);
    } catch (error) {
      console.log(error);
      res.status(404).json("No matched User");
      throw new Error("No query title");
    }
  } else {
    res.status(404).json("No query title");
  }
});

module.exports = {
  getAllUsersController,
  getUserByIdController,
  getUserByNameController,
  deleteUserController,
  searchUserByNameController,
  followUserController,
  getCurrUserProfileController,
};
