const express = require('express');
const dbConfig = require('./config/mongoose.config');
const config = require('./config/config')[process.env.NODE_ENV];

const app = express();

// Setup express server
require('./config/express.config')(app);


dbConfig(config.MONGODB_URL)
    .then(() => {
        console.log('DB connected!');
        app.listen(config.PORT, () => console.log('Server is listening on port: ' + config.PORT))
    }).catch(err => {
        console.log('DB connection error: ', err);
    });
