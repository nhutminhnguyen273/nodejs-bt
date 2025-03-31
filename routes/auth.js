var express = require('express');
var router = express.Router();
let userControllers = require('../controllers/users')
let { check_authentication } = require("../utils/check_auth")
let jwt = require('jsonwebtoken');
let constants = require('../utils/constants')

// Login - no authentication required
router.post('/login', async function (req, res, next) {
    try {
        let username = req.body.username;
        let password = req.body.password;
        let result = await userControllers.checkLogin(username, password);
        res.status(200).send({
            success: true,
            data: jwt.sign({
                id: result,
                expireIn: (new Date(Date.now() + 3600 * 1000)).getTime()
            }, constants.SECRET_KEY)
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: error.message
        });
    }
});

// Signup - no authentication required
router.post('/signup', async function (req, res, next) {
    try {
        let { username, password, email } = req.body;
        
        // Validate required fields
        if (!username || !password || !email) {
            return res.status(400).send({
                success: false,
                message: "Username, password and email are required"
            });
        }

        // Create user with 'user' role
        let result = await userControllers.createAnUser(
            username,
            password,
            email,
            'user'
        );

        res.status(200).send({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(400).send({
            success: false,
            message: error.message
        });
    }
});

// Get current user profile - requires authentication
router.get('/me', check_authentication, async function (req, res, next) {
    try {
        res.send({
            success: true,
            data: req.user
        });
    } catch (error) {
        res.status(400).send({
            success: false,
            message: error.message
        });
    }
});

// Change password - requires authentication
router.post('/changepassword', check_authentication, async function (req, res, next) {
    try {
        let { oldpassword, newpassword } = req.body;
        
        // Validate required fields
        if (!oldpassword || !newpassword) {
            return res.status(400).send({
                success: false,
                message: "Old password and new password are required"
            });
        }

        let user = await userControllers.changePassword(req.user, oldpassword, newpassword);
        res.send({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(400).send({
            success: false,
            message: error.message
        });
    }
});

module.exports = router