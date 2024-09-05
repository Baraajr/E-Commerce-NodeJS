const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

// check works for params and body
// this is a validator middleware to validate the params.id in order to catch error before it is sent to the database
exports.getSubCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid Subcategory id'),
  validatorMiddleware,
];

exports.createSubCategoryValidator = [
  check('name')
    .notEmpty()
    .withMessage('Subcategory name required')
    .isLength({ min: 2 })
    .withMessage('Too short Subcategory name')
    .isLength({ max: 32 })
    .withMessage('Too long Subcategory name'),
  check('category')
    .notEmpty()
    .withMessage('sub category must belong to category')
    .isMongoId()
    .withMessage('invalid category id'),
  validatorMiddleware,
];

exports.updateSubCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid Subcategory id'),
  validatorMiddleware,
];

exports.deleteSubCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid Subcategory id'),
  validatorMiddleware,
];
