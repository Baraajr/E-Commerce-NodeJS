const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const slugify = require('slugify');
const Product = require('../models/productModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');

exports.uploadProductImages = uploadMixOfImages([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);

exports.resizeProductImages = catchAsync(async (req, res, next) => {
  if (req.files.imageCover) {
    const imageCoverFilename = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(`uploads/products/${imageCoverFilename}`);

    req.body.imageCover = imageCoverFilename;
  }
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (image, index) => {
        const imageFilename = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
        await sharp(image.buffer)
          .resize(600, 600)
          .toFormat('jpeg')
          .jpeg({ quality: 95 })
          .toFile(`uploads/products/${imageFilename}`);

        req.body.images.push(imageFilename);
      }),
    );
  }
  next();
});

exports.setBodySlug = (req, res, next) => {
  req.body.slug = slugify(req.body.title);
  next();
};

exports.getAllProducts = factory.getAll(Product, '', 'Products');
exports.createProduct = factory.createOne(Product);
exports.getProduct = factory.getOne(Product, 'reviews');
exports.updateProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);

exports.search = catchAsync(async (req, res, next) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Search text is required' });
  }

  // Build the query object
  const query = {
    $or: [
      { title: { $regex: text, $options: 'i' } },
      { description: { $regex: text, $options: 'i' } },
    ],
  };

  // Perform the search
  const products = await Product.find(query);

  res.json({ products });
});
