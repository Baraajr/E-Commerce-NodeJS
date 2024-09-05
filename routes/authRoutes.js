const express = require('express');
const authControllers = require('../controllers/authControllers');
const {
  signupValidator,
  loginValidator,
} = require('../utils/validators/authValidator');

const router = express.Router();

router.post('/signup', signupValidator, authControllers.signup);

router.post('/login', loginValidator, authControllers.login);

router.get('/logout', authControllers.logout);

router.post('/forgotpassword', authControllers.forgotPassword);

router.post('/verifyResetCode', authControllers.verifyPasswordResetCode);

router.patch('/resetPassword', authControllers.resetPassword);

module.exports = router;
