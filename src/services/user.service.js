const User = require('../models/User');

const createUser = async (userData) => {
    if (await User.isUsernameTaken(userData.username)) {
        throw new Error('Username already taken!');
    }
    return User.create(userData);
}

const getUserById = async (id) => {
    return User.findById(id);
}

const updateUserById = async (id, userData) => {
    const user = await getUserById(id);

    if(!user) throw new Error('User not fount');

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