const express = require('express');
const subCategoryRouter = require('./subCategoryRoutes');
const authControllers = require('../controllers/authControllers');
const {
  getCategoryValidator,
  createCategoryValidator,
  deleteCategoryValidator,
  updateCategoryValidator,
} = require('../utils/validators/categoryValidator');
const {
  uploadCategoryImage,
  resizeImage,
  getAllCategories,
  createCategory,
  updateCategory,
  getCategory,
  deleteCategory,
} = require('../controllers/categoryControllers');

const router = express.Router();

// for nested routes
router.use('/:categoryId/subcategories', subCategoryRouter);

/////////////////////////////      MAIN CRUDS ROUTES      /////////////////////////////

// route api/v1/categories
router
  .route('/')
  .get(getAllCategories)
  .post(
    authControllers.protect,
    authControllers.restrictTo('admin', 'manager'),
    uploadCategoryImage,
    resizeImage,
    createCategoryValidator,
    createCategory,
  );

router
  .route('/:id')
  .get(getCategoryValidator, getCategory)
  .patch(
    authControllers.protect,
    authControllers.restrictTo('admin', 'manager'),
    uploadCategoryImage,
    resizeImage,
    updateCategoryValidator,
    updateCategory,
  )
  .delete(
    authControllers.protect,
    authControllers.restrictTo('admin'),
    deleteCategoryValidator,
    deleteCategory,
  );

module.exports = router;
