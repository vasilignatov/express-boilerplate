;
const router = require('express').Router();
const userController = require('./user.route.js');

router.use('/user', userController);
// router.use('/auth',);

module.exports = router;