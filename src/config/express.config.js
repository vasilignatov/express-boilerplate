const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('../routes/routes');
const errorHandler = requrie('../middlewares/error');

function expressConfig(app) {
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({
        extended: true
    }));
    app.use(helmet());
    app.use(routes);
    app.use(errorHandler());
}

module.exports = expressConfig;
