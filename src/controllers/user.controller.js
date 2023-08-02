const httpStatus = require('http-status');
const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync')

const createUser = catchAsync(async (req, res) => {
    const user = await userService.createUser(req.body);
    res
        .status(httpStatus.CREATED)
        .send(user);
});

const getUsers = (req, res) => {
    // TODO: query string filtering
}

const getUser = catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.params.userId);
    if (!user) {
        throw new Error('User not found');
    }
    res.send(user);
});


const deleteUser = catchAsync(async (req, res) => {
    const user = await userService.deleteUserById(req.params.userId);
    res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
    const user = await userService
        .updateUserById(req.params.userId, req.body);

    res.send(user);
});

module.exports = {
    createUser,
    getUser,
    deleteUser,
    updateUser
}