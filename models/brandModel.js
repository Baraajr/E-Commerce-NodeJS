const { Schema, default: mongoose } = require('mongoose');

const brandSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'brand name is required'],
      unique: [true, 'brand must be unique'],
      minLength: [3, 'Too short brand name'],
      maxLength: [32, 'Too long brand name'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }, // timestamps creates two fields created at and updated at
);

// to send the url of the image
const setImageURL = (doc) => {
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/brands/${doc.image}`;
    doc.image = imageUrl;
  }
};
// findOne, findAll and update
brandSchema.post('init', (doc) => {
  setImageURL(doc);
});

// create
brandSchema.post('save', (doc) => {
  setImageURL(doc);
});

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
