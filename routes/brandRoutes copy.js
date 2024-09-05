const express = require('express');
const authControllers = require('../controllers/authControllers');
const {
  getBrandValidator,
  createBrandValidator,
  deleteBrandValidator,
  updateBrandValidator,
} = require('../utils/validators/brandValidator');

const {
  uploadBrandImage,
  resizeImage,
  getAllBrands,
  createBrand,
  updateBrand,
  getBrand,
  deleteBrand,
} = require('../controllers/brandControllers');

const router = express.Router();

router
  .route('/')
  .get(getAllBrands)
  .post(
    authControllers.protect,
    authControllers.restrictTo('admin', 'manager'),
    uploadBrandImage,
    resizeImage,
    createBrandValidator,
    createBrand,
  );

router
  .route('/:id')
  .get(getBrandValidator, getBrand)
  .patch(
    authControllers.protect,
    authControllers.restrictTo('admin', 'manager'),
    uploadBrandImage,
    resizeImage,
    updateBrandValidator,
    updateBrand,
  )
  .delete(
    authControllers.protect,
    authControllers.restrictTo('admin'),
    deleteBrandValidator,
    deleteBrand,
  );

module.exports = router;
