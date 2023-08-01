const httpStatus = require('http-status');
const config = require('../config/config');

const errorHandler = (err, req, res, next) => {
    console.log(err);
    let { message, statusCode } = err;
    if (config.env == 'production' && err.isOperational == false) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
    }
    

    res
        .status(statusCode)
        .send({
            statusCode,
            message
        });
}

module.exports = errorHandler;