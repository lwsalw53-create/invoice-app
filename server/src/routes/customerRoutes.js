const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const customerController = require('../controllers/customerController');

const router = express.Router();

router.use(auth);
router.get('/', asyncHandler(customerController.list));
router.get('/:id', asyncHandler(customerController.get));
router.post('/', asyncHandler(customerController.create));
router.put('/:id', asyncHandler(customerController.update));
router.delete('/:id', asyncHandler(customerController.remove));

module.exports = router;
