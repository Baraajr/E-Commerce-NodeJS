/* eslint-disable import/no-extraneous-dependencies */
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const Category = require('../models/categoryModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');

// 1) disk storage solution
//cb(null,'uploads/categories') null means no error
// success => 'uploads/categories'
// const multerStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/categories');
//   },
//   filename: function (req, file, cb) {
//     //category-${id}-Date.now().jpeg
//     const extension = file.mimetype.split('/')[1];
//     const filename = `category-${uuidv4()}-${Date.now()}.${extension}`;
//     cb(null, filename);
//   },
// });
// memory  storage  to use the buffer
// const multerStorage = multer.memoryStorage();
// const multerFilter = function (req, file, cb) {
//   if (file.mimetype.startsWith('image')) {
//     cb(null, true);
//   } else {
//     cb(new AppError('Only images allowed', 400), false);
//   }
// };
// const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
// we created upload image middleware

//upload single image
exports.uploadCategoryImage = uploadSingleImage('image');

// to use sharp we use the memory storage coz it enables sharp to use buffer
exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  const filename = `category-${uuidv4()}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`uploads/categories/${filename}`);

  req.body.image = filename;
  next();
});

exports.createFilterObject = (req, res, next) => {
  let filterObj;
  if (req.params.categoryId) filterObj = { product: req.params.categoryId };
  req.filterObj = filterObj;
  next();
};

//  route:  GET api/v1/categories
//  access  public
exports.getAllCategories = factory.getAll(Category);

//  route:  POST api/v1/categories
//  access  admin
exports.createCategory = factory.createOne(Category);

//  route:  PATCH api/v1/categories/id
//  access  admin
exports.updateCategory = factory.updateOne(Category);

//  route:  GET api/v1/categories/id
//  access  public
exports.getCategory = factory.getOne(Category, 'subCategories');

//  route:  DELETE api/v1/categories/id
//  access  admin
exports.deleteCategory = factory.deleteOne(Category);
