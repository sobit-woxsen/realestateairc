const express = require('express');
const { param, query, body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const userController = require('../controllers/user.controller');

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
  validate
], userController.getAllUsers);

router.get('/:id', [
  param('id').isUUID().withMessage('Valid UUID is required'),
  validate
], userController.getUserById);

router.put('/:id', [
  param('id').isUUID().withMessage('Valid UUID is required'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isString(),
  body('role').optional().isIn(['ADMIN', 'AGENT', 'CLIENT']).withMessage('Invalid role'),
  validate
], userController.updateUser);

router.delete('/:id', [
  param('id').isUUID().withMessage('Valid UUID is required'),
  validate
], userController.deleteUser);

module.exports = router;
