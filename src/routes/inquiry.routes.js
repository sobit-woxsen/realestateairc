const express = require('express');
const router = express.Router();
const inquiry = require('../controllers/inquiry.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { body, param, query } = require('express-validator');

router.post('/', 
    authenticate, 
    authorize('CLIENT'), 
    [
        body('propertyId').isUUID().withMessage('Invalid propertyId'),
        body('message').notEmpty().withMessage('Message is required')
    ], 
    validate, 
    inquiry.createInquiry
);

router.get('/', 
    authenticate, 
    authorize('ADMIN'), 
    inquiry.getAllInquiries
);

router.get('/my', 
    authenticate, 
    authorize('CLIENT'), 
    inquiry.getMyInquiries
);

router.get('/:id', 
    authenticate, 
    [
        param('id').isUUID().withMessage('Invalid ID format')
    ], 
    validate, 
    inquiry.getInquiryById
);

router.put('/:id/assign', 
    authenticate, 
    authorize('ADMIN'), 
    [
        param('id').isUUID().withMessage('Invalid ID format'),
        body('agentId').isUUID().withMessage('Invalid agentId format')
    ], 
    validate, 
    inquiry.assignInquiry
);

router.put('/:id/status', 
    authenticate, 
    authorize('ADMIN', 'AGENT'), 
    [
        param('id').isUUID().withMessage('Invalid ID format'),
        body('status').isIn(['NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED']).withMessage('Invalid status')
    ], 
    validate, 
    inquiry.updateInquiryStatus
);

module.exports = router;
