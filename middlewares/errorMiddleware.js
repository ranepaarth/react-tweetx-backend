const constants = require("../constants");

const notFoundError = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);

  next(error);
  res.status(404);
};

const errorHandler = (error, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = error.message;

  if (error.name === "CastError" && error.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

 return res.status(statusCode).json({
    message,
    status: constants.NODE_ENV === "production" ? null : error.stack,
  });
};

module.exports = { errorHandler, notFoundError };
