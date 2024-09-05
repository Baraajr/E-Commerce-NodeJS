const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      // required: [true, 'name is required'],
      unique: [true, ' subcategory name must be unique '],
      minLength: [2, 'too short subcategory name'],
      maxLength: [32, 'too long subcategory name'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Please provide the parent category'],
    },
  },
  {
    timestamps: true,
  },
);

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

module.exports = SubCategory;
