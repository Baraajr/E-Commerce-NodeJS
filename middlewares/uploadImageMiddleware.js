const multer = require('multer');
const ApiError = require('../utils/appError');

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

const multerOptions = () => {
  const multerStorage = multer.memoryStorage();

  const multerFilter = function (req, file, cb) {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new ApiError('Only Images allowed', 400), false);
    }
  };

  const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

  return upload;
};

exports.uploadSingleImage = (fieldName) => multerOptions().single(fieldName);

exports.uploadMixOfImages = (arrayOfFields) =>
  multerOptions().fields(arrayOfFields);
