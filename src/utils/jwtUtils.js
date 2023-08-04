const promisify = require('util').promisify;
const jwt = require('jsonwebtoken');

const sign = promisify(jwt.sign);
const verify = promisify(jwt.verify);

module.exports = {
    sign,
    verify
}