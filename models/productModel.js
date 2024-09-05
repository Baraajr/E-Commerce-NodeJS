const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A product must have a name'],
      minLength: [3, 'Too shortProduct name '],
      trim: true,
    },
    slug: {
      type: String,
      require: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'A product must have a description'],
      minLength: [20, 'Too short product description'],
    },
    quantity: {
      type: Number,
      required: [true, 'quantity is required'],
    },
    sold: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      trim: true,
      required: [true, 'A product must have a price'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    priceAfterDiscount: {
      type: Number,
    },
    colors: {
      type: [String],
    },
    images: {
      type: [String],
    },
    imageCover: {
      type: String,
      required: [true, 'product cover image is required'],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'product must belong to category'],
    },
    subcategories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'SubCategory',
      },
    ],
    brand: {
      type: mongoose.Schema.ObjectId,
      ref: 'Brand',
    },
    ratingsAverage: {
      type: Number,
      min: [1, 'Rating must be equal or above 1'],
      max: [5, 'Rating must be equal or below 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// populate the category field
productSchema.pre(/^find/, function (next) {
  this.populate({ path: 'category', select: 'name' });
  next();
});

// send the image url in the response
const setImageURL = (doc) => {
  if (doc.imageCover) {
    const imageUrl = `${process.env.BASE_URL}/products/${doc.imageCover}`;
    doc.imageCover = imageUrl;
  }
};
// findOne, findAll and update
productSchema.post('init', (doc) => {
  setImageURL(doc);
});

// create
productSchema.post('save', (doc) => {
  setImageURL(doc);
});

// virtual populate reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

productSchema.index({ title: 1, description: 1 });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
