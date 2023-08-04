const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const userService = require('../services/user.service');
const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');
const AppError = require('../utils/AppError');

const register = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await userService.createUser({ email, password });
    const token = await tokenService.generateAuthTokens(user);

    res
        .status(httpStatus.CREATED)
        .json({ user, token });
});

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const user = await authService.loginLocal(email, password);
    const token = await tokenService.generateAuthTokens(user);

    res.json({ user, token });
});

const logout = catchAsync(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res
        .status(httpStatus.NO_CONTENT)
        .json({ ok: true });
});

const refreshTokens = catchAsync( async (req, res) => {
    const tokens = await authService.refreshAuth(req.body.refreshToken);
    res.json({tokens});
});


module.exports = {
    register,
    login,
    logout,
    refreshTokens
}