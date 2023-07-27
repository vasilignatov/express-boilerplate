const express = require('express');
const helmet = require('helmet');
const cors = require('cors');


function expressConfig(app) {
    app.use(cors);
    app.use(express.json());
    app.use(express.urlencoded({
        extended: true
    }));
    app.use(helmet());
}

module.exports = expressConfig;
