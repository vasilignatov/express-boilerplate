const User = require('../models/User');
const AppError = require('../utils/AppError');
const httpStatus = require('http-status');

const createUser = async (userData) => {
    if (await User.isUsernameTaken(userData.username)) {
        throw new AppError('Username already taken!', httpStatus.BAD_REQUEST);
    }
    return User.create(userData);
}

const getUserById = async (id) => {
    return User.findById(id);
}

const updateUserById = async (id, userData) => {
    const user = await getUserById(id);

    if(!user) throw new AppError('User not fount', httpStatus.NOT_FOUND);

    Object.assign(user, userData);
    await user.save();
    return user;
}

const deleteUserById = async (id) => {
    return await User.findByIdAndDelete(id);
}

module.exports = {
    createUser,
    getUserById,
    updateUserById,
    deleteUserById
}