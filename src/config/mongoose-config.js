const mongoose = require('mongoose');

export default function dbConfig(connectionString) {
    mongoose.set('strictQuery', false);
    return mongoose.connect(connectionString);
}