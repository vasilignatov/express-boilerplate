const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const userService = require('../services/user.service');
const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');

const register = catchAsync(async (req, res) => {
    const { email, password, username } = req.body;
    const user = await userService.createUser({ email, password, username});
    const tokens = await tokenService.generateAuthTokens(user);

    res
        .status(httpStatus.CREATED)
        .json({ user, tokens });
});

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const user = await authService.loginLocal(email, password);
    const tokens = await tokenService.generateAuthTokens(user);

    res.json({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res
        .status(httpStatus.NO_CONTENT)
        .json({ ok: true });
});

const refreshTokens = catchAsync(async (req, res) => {
    const tokens = await authService.refreshAuth(req.body.refreshToken);
    res.json({ tokens });
});


module.exports = {
    register,
    login,
    logout,
    refreshTokens
}