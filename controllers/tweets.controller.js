const Tweet = require("../models/tweets.models");
const User = require("../models/users.models");
const asyncHandler = require("express-async-handler");

const getTweetsAllController = asyncHandler(async (req, res) => {
  try {
    const tweets = await Tweet.find({});
    res.status(200).json(tweets);
  } catch (error) {
    console.log(error);
  }
});

const getAllTweetsController = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).populate("followings");

  const followingIds = user.followings.map((user) => user._id);

  const followingTweets = await Tweet.find({
    createdBy: { $in: followingIds },
  }).populate([{ path: "createdBy", select: "userName fullName" }]);

  const currUserTweets = await Tweet.find({ createdBy: userId }).populate([
    { path: "createdBy", select: "userName fullName" },
  ]);

  const tweets = [...followingTweets, ...currUserTweets].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  res.status(200).json(tweets);
});

const getTweetById = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    res.status(404);
    throw new Error("Tweet not found");
  }

  res.status(200).json(tweet);
});

const createTweetController = asyncHandler(async (req, res) => {
  const user = req.user;
  const { content } = req.body;
  const tweet = await Tweet.create({
    userName: user.userName,
    createdBy: user.id,
    content,
  });

  // pushing the created Tweet Id into the tweets array field of the user
  await User.findByIdAndUpdate(
    user.id,
    {
      $push: { tweets: tweet._id },
    },
    { new: true }
  );

  res.status(200).json(tweet);
});

const updateTweetController = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  let tweetToUpdate = await Tweet.findById(tweetId);

  if (!tweetToUpdate) {
    res.status(404);
    throw Error("Tweet not found");
  }

  if (tweetToUpdate.content === content) {
    tweetToUpdate = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: { updatedAt: tweetToUpdate?.createdAt },
      },
      { new: true }
    );

    return res.status(200);
  }

  tweetToUpdate = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content },
    },
    {
      new: true,
    }
  );

  res.status(200).json(tweetToUpdate);
});

const likeTweetController = asyncHandler(async (req, res) => {
  const currUserId = req.user.id;
  const { tweetId } = req.params;

  let tweet = await Tweet.findById(tweetId);

  if (tweet.likedBy.includes(currUserId)) {
    tweet = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $pull: { likedBy: currUserId },
      },
      {
        new: true,
      }
    );

    return res.status(200).json({ message: "Tweet disliked." });
  }

  tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $push: { likedBy: currUserId },
    },
    { new: true }
  );

  res.status(200).json(tweet);
});

const saveTweetController = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user.id;

  let user = await User.findById(userId);

  if (user.savedTweets.includes(tweetId)) {
    user = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { savedTweets: tweetId },
      },
      {
        new: true,
      }
    );

    return res.status(200).json({
      message: "Tweet unsaved.",
      savedTweets: user.savedTweets,
      isSaved: false,
    });
  }

  // pushing the saved tweet id in the savedTweets array for future user.
  user = await User.findByIdAndUpdate(
    userId,
    {
      $push: { savedTweets: { $each: [tweetId], $position: 0 } },
    },
    {
      new: true,
    }
  );
  res.status(200).json({
    message: "Tweet saved successfully",
    savedTweets: user.savedTweets,
    isSaved: true,
  });
});

const getSavedTweetsController = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // const user = await User.findById(userId).populate([
  //   { path: "savedTweets", select: "userName likedBy content" },
  // ]);
  const { savedTweets: savedTweetsIds } = await User.findById(userId);

  const currentUser = await User.findById(userId)
    .populate([
      {
        path: "savedTweets",
        populate: {
          path: "createdBy",
          select: "userName fullName",
        },
      },
    ])
    .select("savedTweets userName fullName");

  res.status(200).json({ currentUser, savedTweetsIds });
});

const deleteTweetController = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const tweet = await Tweet.findByIdAndDelete(tweetId);
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { tweets: tweetId, savedTweets: tweetId },
  });
  res.status(200).json(tweet);
});

module.exports = {
  getAllTweetsController,
  getTweetById,
  createTweetController,
  updateTweetController,
  likeTweetController,
  deleteTweetController,
  saveTweetController,
  getSavedTweetsController,
  getTweetsAllController,
};
