;
const router = require('express').Router();
const userController = require('./user.route.js');

router.use('/users', userController);
// router.use('/auth', authController);

module.exports = router;