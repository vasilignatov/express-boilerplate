const httpStatus = require('http-status');
const config = require('../config/config');
const { MongooseError } = require('mongoose');

const errorHandler = (err, req, res, next) => {
    let { message, statusCode } = err;

    if (err instanceof MongooseError) {
        statusCode = httpStatus.BAD_REQUEST;
    }

    if (config.env == 'production' && err.isOperational == false) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
    }

    res
        .status(statusCode)
        .json({
            statusCode,
            message
        });
}

module.exports = errorHandler;