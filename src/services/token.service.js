const jwt = require('../utils/jwtUtils');
const httpStatus = require('http-status');
const config = require('../config/config')[process.env.NODE_ENV];
const userService = require('../services/user.service');
const Token = require('../models/Token');
const AppError = require('../utils/AppError');


/**
 // TODO: Change type when other token types logic are implemented
 * @returns {Promise<string>} via jwt utils!
 */
const createToken = (userId, expires, type = 'refresh', secret = config.JWT_SECRET) => {
    console.log('TOKEN EXPIRES: ', expires);
    const payload = {
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: expires,
        type
    }
    return jwt.sign(payload, secret);
}

const saveToken = async (token, userId, expires, type, blacklisted = false) => {
    return await Token.create({
        token,
        user: userId,
        expires,
        type,
        blacklisted
    });
}

// TODO: Change type when other token types logic are implemented
const verifyToken = async (token, type = 'refresh') => {
    const decoded = await jwt.verify(token, config.JWT_SECRET);
    const tokenDocument = await Token.findOne({ token, type, user: decoded.sub, blacklisted: false });

    if (!tokenDocument) {
        throw new AppError('Token Not Found', httpStatus.NOT_FOUND);
    }
    return tokenDocument;
}

const generateAuthTokens = async (user) => {
    const date = Date.now();

    const accessTokenExpires = date + 1000 * 60 * config.JWT_ACCESS_EXPIRATION_MINUTES;
    const accessToken = await createToken(user.id, accessTokenExpires, 'access');

    const refreshTokenExpires = date + 1000 * 60 * 60 * 24 * config.JWT_REFRESH_EXPIRATION_DAYS;
    const refreshToken = await createToken(user.id, refreshTokenExpires, 'refresh');

    await saveToken(refreshToken, user.id, refreshTokenExpires, 'refresh');

    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires
        }
    }
}

module.exports = {
    createToken,
    saveToken,
    verifyToken,
    generateAuthTokens
}