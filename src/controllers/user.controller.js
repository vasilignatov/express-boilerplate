const httpStatus = require('http-status');
const userService = require('../services/user.service');

const createUser = async (req, res) => {
    const user = await userService.createUser(req.body);
    console.log("USER: ", user);
    res
        .status(httpStatus.CREATED)
        .send(user);
}

const getUsers = (req, res) => {
    // TODO: query string filtering
}

const getUser = async (req, res) => {
    const user = await userService.getUserById(req.params.userId);
    if (!user) {
        throw new Error('User not found');
    }
    res.send(user);
}


const deleteUser = async (req, res) => {
    const user = await userService.deleteUserById(req.params.userId);
    res.send(user);
}

const updateUser = async (req, res) => {
    const user = await userService
        .updateUserById(req.params.userId, req.body);
        
    res.send(user);
}

module.exports = {
    createUser,
    getUser,
    deleteUser,
    updateUser
}