const express = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const propertyController = require('../controllers/property.controller');

const router = express.Router();

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1 }),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('bedrooms').optional().isInt({ min: 0 }),
  query('bathrooms').optional().isFloat({ min: 0 }),
  validate
], propertyController.getAllProperties);

router.get('/:id', [
  param('id').isUUID().withMessage('Valid UUID is required'),
  validate
], propertyController.getPropertyById);

router.post('/', authenticate, authorize('AGENT', 'ADMIN'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('type').isIn(['HOUSE', 'APARTMENT', 'CONDO', 'TOWNHOUSE', 'LAND', 'COMMERCIAL']).withMessage('Invalid property type'),
  body('status').optional().isIn(['AVAILABLE', 'SOLD', 'PENDING', 'RENTED']),
  body('price').isDecimal().withMessage('Price must be a decimal'),
  body('area').isFloat({ min: 0 }).withMessage('Area must be a positive number'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be an integer'),
  body('bathrooms').isFloat({ min: 0 }).withMessage('Bathrooms must be a number'),
  body('address').notEmpty().withMessage('Address is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('zipCode').notEmpty().withMessage('Zip code is required'),
  body('images').optional().isArray(),
  body('amenities').optional().isArray(),
  body('yearBuilt').optional().isInt(),
  validate
], propertyController.createProperty);

router.put('/:id', authenticate, authorize('AGENT', 'ADMIN'), [
  param('id').isUUID().withMessage('Valid UUID is required'),
  body('title').optional().notEmpty(),
  body('type').optional().isIn(['HOUSE', 'APARTMENT', 'CONDO', 'TOWNHOUSE', 'LAND', 'COMMERCIAL']),
  body('status').optional().isIn(['AVAILABLE', 'SOLD', 'PENDING', 'RENTED']),
  body('price').optional().isDecimal(),
  body('area').optional().isFloat({ min: 0 }),
  body('bedrooms').optional().isInt({ min: 0 }),
  body('bathrooms').optional().isFloat({ min: 0 }),
  body('images').optional().isArray(),
  body('amenities').optional().isArray(),
  body('yearBuilt').optional().isInt(),
  validate
], propertyController.updateProperty);

router.delete('/:id', authenticate, authorize('AGENT', 'ADMIN'), [
  param('id').isUUID().withMessage('Valid UUID is required'),
  validate
], propertyController.deleteProperty);

module.exports = router;
