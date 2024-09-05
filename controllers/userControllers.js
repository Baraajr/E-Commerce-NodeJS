const slugify = require('slugify');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const User = require('../models/userModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.uploadUserImage = uploadSingleImage('profileImg');

// to use sharp we use the memory storage coz it enables sharp to use buffer
exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`uploads/users/${filename}`);

  req.body.profileImg = filename;

  next();
});

// only admin will use these
exports.getAllUsers = factory.getAll(User);
exports.createUser = factory.createOne(User);
exports.getUser = factory.getOne(User);

exports.updateUser = catchAsync(async (req, res, next) => {
  // prevent this route from updating password
  if (req.body.password)
    return next(new AppError('this route is not for updating password', 400));

  if (req.body.name) req.body.slug = slugify(req.body.name);

  // prevent changing the user role
  delete req.body.role;

  const updatedDoc = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedDoc) {
    return next(new AppError('No document found with this ID', 404));
  }

  res.status(200).json({
    status: 'success',
    updatedDoc,
  });
});
exports.deleteUser = factory.deleteOne(User);

exports.updateUserPassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new AppError('user not found', 400));

  // we used the save method to hash the password using the pre save middleware /
  user.password = req.body.password;
  await user.save();

  res.status(200).json({
    status: 'password updated successfully',
    user,
  });
});

// only admin can use this
exports.updateUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  // Check if the role is valid
  const validRoles = ['user', 'admin', 'seller'];
  if (!validRoles.includes(role)) {
    return next(new AppError('Invalid role specified', 400));
  }

  // Update the user's role
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true },
  );

  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.getLoggedUserData = catchAsync(async (req, res, next) => {
  req.params.id = req.user._id;
  // to use the getUser() middleware fuction
  next();
});

exports.updateLoggedUserData = catchAsync(async (req, res, next) => {
  // prevent updating the password through this
  if (req.body.password || req.body.confirmPassword)
    return next(
      new AppError(
        'this route is not for updating password please use /updateMyPassword',
        400,
      ),
    );

  // to filter the body
  const filteredObj = filterObj(
    req.body,
    'name',
    'phone',
    'profileImg',
    'email',
  );
  const user = await User.findByIdAndUpdate(req.user._id, filteredObj, {
    new: true,
    runValidators: true,
  });
  if (!user) return next(new AppError('Error, Please login again', 400));

  res.status(200).json({
    status: 'success',
    message: 'User data updated successfully',
    data: {
      user,
    },
  });
});

exports.updateLoggedUserPassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, passwordConfirm } = req.body;

  if (!currentPassword)
    return next(new AppError(' Please  provide your current password', 400));
  if (!newPassword)
    return next(new AppError(' Please provide your new password', 400));
  if (!passwordConfirm)
    return next(new AppError(' Please confirm your password', 400));

  const user = await User.findById(req.user._id).select('+password');

  if (!user) return next(new AppError('Error, Please login again', 400));

  if (!(await user.correctPassword(currentPassword, user.password)))
    return next(new AppError('Incorrect current password', 400));

  if (passwordConfirm !== newPassword)
    return next(new AppError("Passwords don't match", 400));

  user.password = newPassword;

  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res.cookie('JWT', token, cookieOptions);

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully ',
    token,
    data: {
      user,
    },
  });
});

// change the active field to false
exports.deleteLoggedUserData = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({ status: 'Success' });
});
