const express = require("express");
const cookieParser = require("cookie-parser");
const constants = require("./constants");
const cors = require("cors");
const {
  notFoundError,
  errorHandler,
} = require("./middlewares/errorMiddleware");
const userRouter = require("./routes/users.routes");
const { authRouter } = require("./routes/auth.routes");
const { tweetRouter } = require("./routes/tweets.routes");

const app = express();

const corsOptions = {
  origin: constants.ALLOWED_URLS,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Access-Control-Allow-Private-Network"],
};

app.use(cors(corsOptions));
app.options("*", cors());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/tweets", tweetRouter);

app.get("/", (req, res) => {
  res.send("everything fine");
});

app.use(notFoundError);
app.use(errorHandler);

module.exports = app;
