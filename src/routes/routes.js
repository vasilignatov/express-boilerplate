const httpStatus = require('http-status');
const router = require('express').Router();
const userController = require('./user.route.js');
const authController = require('./auth.route.js');

const AppError = require('../utils/AppError');

router.use((req, res, next) => {
    console.log(req.url);
    next();
});

router.get('/', (req, res) => {
    res.send('<h1>Express Boilerplate</h1>');
});


router.use('/users', userController);
router.use('/auth', authController);

router.all('*', (req, res, next) => {
    next(new AppError(httpStatus['404'], httpStatus.NOT_FOUND));
});

module.exports = router;