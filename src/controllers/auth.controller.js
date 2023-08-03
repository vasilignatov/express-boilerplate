const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const userService = require('../services/user.service');
const authService = require('../services/auth.service');
const AppError = require('../utils/AppError');

const register = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await userService.createUser({email, password});
    
    //TODO: GENERATE TOKENS;
    let token;
   
    res
        .status(httpStatus.CREATED)
        .json({user, token});
        // send token and user;
});

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const user = await authService.loginLocal(email, password);
    
    // TODO: TOKEN
    let token;

    res.json({user, token});
});

const logout = catchAsync(async (req, res) => {

});


module.exports = {
    register,
    login,
    logout
}