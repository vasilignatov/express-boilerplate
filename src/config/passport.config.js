const passport = require('passport');
const { ExtractJwt, Strategy: JwtStrategy } = require('passport-jwt');
const config = require('./config')[process.env.NODE_ENV];
const User = require('../models/User');
const AppError = require('../utils/AppError');
const httpStatus = require('http-status');

const opt = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.JWT_SECRET
}

const verify = async (payload, done) => {
    try {
        if (payload.type !== 'access') {
            throw new AppError('Invalid token type', httpStatus.UNAUTHORIZED);
        }

        const user = await User.findById(payload.sub);

        if (!user) {
            return done(null, false);
        }

        done(null, user);

    } catch (err) {
        done(err, false);
    }
};

const jwtStrategy = new JwtStrategy(opt, verify);

module.exports = jwtStrategy;