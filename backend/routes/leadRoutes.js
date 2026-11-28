const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { checkFeature } = require('../middleware/planMiddleware');

router.get('/', checkFeature('leads'), leadController.getLeads);
router.post('/batch', checkFeature('leads'), leadController.batchLeads);
router.post('/', checkFeature('leads'), leadController.createLead);
router.put('/:id', checkFeature('leads'), leadController.updateLead);
router.delete('/:id', checkFeature('leads'), leadController.deleteLead);

module.exports = router;
