const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const catchAsync = require('../utils/catchAsync');
const Brand = require('../models/brandModel');
const factory = require('./handlerFactory');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');

exports.uploadBrandImage = uploadSingleImage('image');

exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const filename = `brand-${uuidv4()}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`uploads/brands/${filename}`);

  req.body.image = filename;

  next();
});

//  route:  GET api/v1/brands
//  access  public
exports.getAllBrands = factory.getAll(Brand);

//  route:  POST api/v1/brands
//  access  admin
exports.createBrand = factory.createOne(Brand);

//  route:  PATCH api/v1/brands/id
//  access  admin
exports.updateBrand = factory.updateOne(Brand);

//  route:  GET api/v1/brands/id  id = mongo id
//  access  public
exports.getBrand = factory.getOne(Brand);

//  route:  DELETE api/v1/brands/id
//  access  admin
exports.deleteBrand = factory.deleteOne(Brand);
