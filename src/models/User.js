const mongoose = require('mongoose');
const toJson = require('@meanie/mongoose-to-json');
const bcrypt = require('bcrypt');
const validator = require('validator');
const config = require('../config/config')[process.env.NODE_ENV];

const userSchema = mongoose.Schema({
    username: {
        type: String,
        trim: true,
        required: true
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

userSchema.statics.isEmailTaken = async function (email) {
    const user = await this.findOne({ email });
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


userSchema.plugin(toJson);

const User = mongoose.model('User', userSchema);
module.exports = User;