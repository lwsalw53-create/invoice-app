const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');

const router = express.Router();

router.use(auth);
router.get('/', asyncHandler(invoiceController.list));
router.get('/:id', asyncHandler(invoiceController.get));
router.post('/', asyncHandler(invoiceController.create));
router.put('/:id', asyncHandler(invoiceController.update));
router.delete('/:id', asyncHandler(invoiceController.remove));
router.get('/:id/pdf', asyncHandler(invoiceController.downloadPdf));

module.exports = router;
