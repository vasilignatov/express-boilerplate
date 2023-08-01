const httpStatus = requre('httpStatus');
const router = require('express').Router();
const userController = require('./user.route.js');

router.use('/users', userController);
// router.use('/auth', authController);

router.all('*', (req, res, next) => {
    next(new AppError(httpStatus[httpStatus[404]]), httpStatus[404]);
});

module.exports = router;