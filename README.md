# express-boilerplate
A boilerplate for quickly building RESTful APIs using Express and Mongoose.

## Quick Start

```
npx create-boilerplate-express <your-app-name>
```

The script automaticly will rename .env.example to .env and the only thing you need to do is to set ***environment variables***.


Or follow this steps if you want to do the installation manualy:

**1.** Clone repository:
```
git clone https://github.com/vasilignatov/express-boilerplate.git
```
**2.** Install dependencies:
```
npm instal
```
**3.** Remame .env.example to .env and set environment variables.


## Features
- **Authentication and authorization** - passport
- **Error handling** - Global error handler 
- **Database** - MongoDB using Mongoose ODM 
- **Environment variables** - using dotenv 
- **Security** - using helmet to set security HTTP headers
- **CORS** - enabled using cors
- **Compression** - gzip compression with compression
- **Santizing**: sanitize request data against xss and query injection


## Endpoints

Available routes:

**Auth routes**\
`POST /auth/register` - Register route\
`POST /auth/login` - Login route\
`POST /auth/logout` - Logout route\
`POST /auth/refresh-token` - Refresh token route

**User routes**\
`GET /users/` - Get all users\
`POST /users/` - Create user\
`GET /users/:userId` - Get user\
`PUT /users/:userId` - Update route\
`DELETE /users/:userId` - Delete route

## Authentication

Authentication for certain routes is done with `auth` middleware

```javascript
const router = require('express').Router();
const auth = require('../../middlewares/auth');
const someController = require('../controllers/some.controller');

router.get('/profile', auth, someController.getSomeData);
```

These routes require a valid JWT access token in the Authorization request header using the Bearer schema. If the request does not contain a valid access token, an Unauthorized (401) error is thrown.

**Generating Access Tokens**

An access token is generated when a successful request is made to one of the endpoints: `POST /auth/register` or `POST /auth/login` endpoints. 
The response of these endpoints also contains refresh tokens.
An access token is valid for 30 minutes. You can modify this expiration time by changing the `JWT_ACCESS_EXPIRATION_MINUTES` environment variable in the .env file.

**Refreshing Access Tokens**

After the access token expires, a new access token can be generated, by making a call to the refresh token endpoint (`POST /auth/refresh-tokens`) and sending along a valid refresh token in the request body. This call returns a new access token and a new refresh token.

A refresh token is valid for 30 days. You can modify this expiration time by changing the `JWT_REFRESH_EXPIRATION_DAYS` environment variable in the .env file.

## Authorization

The `isAdmin` middleware can be used to require certain rights/permissions to access a route.

```javascript
const express = require('express');
const { auth, isAdmin } = require('../middlewares/auth');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.get('/users', auth, isAdmin, userController.getUsers);
```

If the user making the request does not have the required admin permissions to access this route, a Forbidden (403) error is returned. Note that the isAdmin middleware is used together with the auth middleware, in the sequence shown above in the example (first auth then isAdmin).


## Other

### **toJSON** plugin
The toJSON plugin applies the following changes in the toJSON transform call:

- removes \_\_v, createdAt, updatedAt, and any schema path that has private: true
- replaces \_id with id


## License

[MIT](LICENSE)