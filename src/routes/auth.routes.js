const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  validate
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], authController.login);

router.post('/refresh-token', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validate
], authController.refreshToken);

router.post('/logout', authenticate, authController.logout);

module.exports = router;
