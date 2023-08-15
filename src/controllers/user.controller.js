const httpStatus = require('http-status');
const userService = require('../services/user.service');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');

const createUser = catchAsync(async (req, res) => {
    const user = await userService.createUser(req.body);
    res
        .status(httpStatus.CREATED)
        .send(user);
});

const getUsers = catchAsync(async (req, res) => {
    const users = await userService.getUsers();
    res.json(users);
});

const getUser = catchAsync(async (req, res) => {

    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError('User not found', httpStatus.NOT_FOUND);
    }

    const user = await userService.getUserById(userId);

    if (!user) {
        throw new AppError('User not found', httpStatus.NOT_FOUND);
    }

    res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
    const user = await userService.deleteUserById(req.params.userId.toString());
    res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
    const user = await userService
        .updateUserById(req.params.userId, req.body);

    res.send(user);
});

module.exports = {
    getUsers,
    createUser,
    getUser,
    deleteUser,
    updateUser
}