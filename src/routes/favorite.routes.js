const express = require('express');
const router = express.Router();
const favorite = require('../controllers/favorite.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { body, param } = require('express-validator');

router.use(authenticate, authorize('CLIENT'));

router.get('/', favorite.getFavorites);

router.post('/', 
    [
        body('propertyId').isUUID().withMessage('Invalid propertyId')
    ], 
    validate, 
    favorite.addFavorite
);

router.delete('/:propertyId', 
    [
        param('propertyId').isUUID().withMessage('Invalid propertyId format')
    ], 
    validate, 
    favorite.removeFavorite
);

module.exports = router;
