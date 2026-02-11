const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const productController = require('../controllers/productController');

const router = express.Router();

router.use(auth);
router.get('/', asyncHandler(productController.list));
router.get('/:id', asyncHandler(productController.get));
router.post('/', asyncHandler(productController.create));
router.put('/:id', asyncHandler(productController.update));
router.delete('/:id', asyncHandler(productController.remove));

module.exports = router;
