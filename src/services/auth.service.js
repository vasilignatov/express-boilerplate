const httpStatus = require('http-status');
// TODO: TOKEN SERVICE
const userService = require('./user.service');

const loginLocal = async (email, password) => {
    const user = await userService.getUserByEmail(email);
    if(!user || !(await user.validatePassword(password))) {
        throw new AppError('Wrong username or password', httpStatus.UNAUTHORIZED)
    }
    return user;
}
