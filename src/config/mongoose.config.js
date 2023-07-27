const mongoose = require('mongoose');

function dbConfig(connectionString) {
    mongoose.set('strictQuery', false);
    return mongoose.connect(connectionString);
}

module.exports = dbConfig;