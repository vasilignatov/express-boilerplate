const mongoose = require('mongoose');
const toJSON = require('@meanie/mongoose-to-json');

const tokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        index: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        // TODO: Add other token types: RESET_PASSWORD, VERIFY_EMAIL
        enum: ['refresh'],
        required: true
    },
    expires: {
        type: Date,
        required: true
    },
    blacklisted: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true
    }
);

tokenSchema.plugin(toJSON);

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;