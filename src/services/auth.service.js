const httpStatus = require('http-status');
const Token = require('../models/Token');
const AppError = require('../utils/AppError');
const userService = require('./user.service');
const tokenService = require('./token.service');

const loginLocal = async (email, password) => {
    const user = await userService.getUserByEmail(email);
    const isAuthenticated = await user.validatePassword(password);

    if (!user || !isAuthenticated) {
        throw new AppError('Wrong username or password', httpStatus.UNAUTHORIZED);
    }
    return user;
}

const logout = async (refreshToken) => {
    const token = await Token.findOne({ token: refreshToken, type: 'refresh', blacklisted: false });

    if (!token) {
        throw new AppError(httpStatus[`404_MESSAGE`], httpStatus.NOT_FOUND);
    }
    await token.deleteOne();
}

const refreshAuth = async (refreshToken) => {
    try {
        const refreshTokenDoc = await tokenService.verifyToken(refreshToken, 'refresh');
        const user = await userService.getUserById(refreshTokenDoc.user);
        console.log('USER: ', user);
        if(!user) throw new Error();
        
        await refreshTokenDoc.deleteOne();
        return tokenService.generateAuthTokens(user);
    } catch(err) {
        throw new AppError('Place authenticate', httpStatus.UNAUTHORIZED);
    }
}

module.exports = {
    loginLocal,
    logout,
    refreshAuth
}
