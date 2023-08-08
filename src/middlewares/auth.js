const httpStatus = require('http-status');
const passport = require('passport');
const AppError = require('../utils/AppError');

const auth = (req, res, next) => {

  passport.authenticate('jwt', function (err, user, info, status) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new AppError('Please authenticate', httpStatus.UNAUTHORIZED));
    }

    req.user = Object.assign({}, user);
    req.isAdmin = user.role == 'admin' ? true : false;

    next();
  })(req, res, next);
}

const isAdmin = async (req, res, next) => {
  if (!req.isAdmin) {
    next(new AppError('You are not authorized', httpStatus.FORBIDDEN));
  }
  next();
}

module.exports = {
  auth,
  isAdmin
}

