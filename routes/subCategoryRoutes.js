const express = require('express');
const authControllers = require('../controllers/authControllers');
const {
  getSubCategoryValidator,
  createSubCategoryValidator,
  deleteSubCategoryValidator,
  updateSubCategoryValidator,
} = require('../utils/validators/subCategoryValidator');

const {
  setCategoryIdToBody,
  getAllSubCategories,
  createSubCategory,
  updateSubCategory,
  getSubCategory,
  deleteSubCategory,
} = require('../controllers/subCategoryControllers');

// merge params allow us to access the parameters form other routes
// ex: we need to access categoryId from category router
const router = express.Router({ mergeParams: true });

// GET categories/categoryId/subcategories
// to hit this route only use
// const router = express.Router({ mergeParams: true }); <== child router and
// router.use('/:categoryId/subCategories', subCategoryRouter); <== parent router

/////////////////////////////      MAIN CRUDS ROUTES      /////////////////////////////

// route api/v1/Subcategories
router
  .route('/')
  .get(getAllSubCategories)
  .post(
    authControllers.protect,
    authControllers.restrictTo('admin', 'manager'),
    setCategoryIdToBody,
    createSubCategoryValidator,
    createSubCategory,
  );

router
  .route('/:id')
  .get(getSubCategoryValidator, getSubCategory)
  .patch(
    authControllers.protect,
    authControllers.restrictTo('admin', 'manager'),
    updateSubCategoryValidator,
    updateSubCategory,
  )
  .delete(
    authControllers.protect,
    authControllers.restrictTo('admin'),
    deleteSubCategoryValidator,
    deleteSubCategory,
  );

module.exports = router;
