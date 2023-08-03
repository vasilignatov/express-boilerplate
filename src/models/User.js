const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const config = require('../config/config')[process.env.NODE_ENV];

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email');
            }
        },
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: [8, 'Password must be at least 8 characters long'],
        validate(value) {
            if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
                throw new Error('Password must contain at least one letter and one number');
            }
        },
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    // isEmailVerified: {
    //     type: Boolean,
    //     default: false,
    // }
}, { timestamps: true });

userSchema.statics.isUsernameTaken = async function (username) {
    const user = await this.findOne({ username });
    return !!user;
}


userSchema.pre('save', function (next) {
    bcrypt.hash(this.password, config.SALT_ROUNDS)
        .then(hash => {
            this.password = hash;
            return next();
        });
});

userSchema.method('validatePassword', function (password) {
    return bcrypt.compare(password, this.password);
});

const User = mongoose.model('User', userSchema);
module.exports = User;