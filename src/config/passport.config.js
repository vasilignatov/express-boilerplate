const passport = require('passport');
const { ExtractJwt, Strategy: JwtStrategy } = require('passport-jwt');
const { JWT_SECRET } = require('./config');
const User = require('../models/User');

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
}


passport.use(options, (payload, done) => {
    try {
        const user = await User.findById(payload.sub);
        if(!user) {
            return done(null, false);
        }
        done(null, user);
    } catch(err) {
        done(err, false);
    }
});

