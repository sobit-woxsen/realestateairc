const express = require('express');
const router = express.Router();
const agent = require('../controllers/agent.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate, authorize('AGENT'));

router.get('/dashboard', agent.getDashboard);
router.get('/listings', agent.getMyListings);
router.get('/leads', agent.getMyLeads);

module.exports = router;
