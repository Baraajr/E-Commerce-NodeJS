const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');

const calculateTotalPrice = (cart) => {
  let totalPrice = 0;
  cart.cartItems.forEach((item) => {
    totalPrice += item.quantity * item.price;
  });

  cart.totalPriceAfterDiscount = undefined;

  return totalPrice;
};

exports.addProductToCart = catchAsync(async (req, res, next) => {
  const { productId, color } = req.body;
  const product = await Product.findById(productId);
  //1) get logged user cart
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    //create cart for this user with product
    cart = await Cart.create({
      user: req.user._id,
      cartItems: [{ product: productId, color, price: product.price }],
    });
  } else {
    // console.log('there is cart');
    // get the index of the product to check if it exists
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId && item.color === color,
    );
    if (productIndex > -1) {
      //add 1 to the quantity
      cart.cartItems[productIndex].quantity += 1;
    } else {
      //the product doesn't exists
      cart.cartItems.push({ product: productId, color, price: product.price });
    }
  }

  //calculate total cart price
  cart.totalCartPrice = calculateTotalPrice(cart);
  await cart.save();

  res.status(200).json({
    status: 'success',
    message: 'Product added successfully to cart',
    cart,
  });
});

exports.getLoggedUserCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return next(
      new AppError(`There is no cart for this user id : ${req.user._id}`, 404),
    );
  }

  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// this works but we have the ID of the whole item
// exports.removeProductFromCart = catchAsync(async (req, res, next) => {
//   const { productId } = req.params;
//   const cart = await Cart.findOne({ user: req.user._id });

//   const productIndex = cart.cartItems.findIndex(
//     (item) =>
//       item.product.toString() === productId && item.color === req.body.color,
//   );

//   if (productIndex < 0)
//     return next(new AppError('Product not found in the cart', 400));
//   cart.cartItems.splice(productIndex, 1);

//   cart.totalCartPrice = calculateTotalPrice(cart);
//   await cart.save();

//   res.status(200).json({
//     status: 'success',
//     message: 'product removed successfully',
//     data: null,
//   });
// });

exports.removeProductFromCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItems: { _id: req.params.itemId } },
    },
    {
      new: true,
    },
  );

  cart.totalCartPrice = calculateTotalPrice(cart);
  await cart.save();

  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

exports.clearLoggedUserCart = catchAsync(async (req, res, next) => {
  await Cart.findOneAndDelete({ user: req.user._id });

  res.status(204).send();
});

exports.updateCartItemQuantity = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart)
    return next(
      new AppError(`There is no cart for this user id : ${req.user._id}`, 404),
    );

  const itemIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === req.params.itemId,
  );
  if (itemIndex < 0)
    return next(
      new AppError(`There is no item with this id : ${req.params.itemId}`, 404),
    );
  cart.cartItems[itemIndex].quantity = req.body.quantity;

  cart.totalCartPrice = calculateTotalPrice(cart);
  await cart.save();

  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

exports.applyCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findOne({
    name: req.body.coupon,
    expire: { $gt: Date.now() },
  });

  if (!coupon) return next(new AppError('Invalid or Expired coupon', 400));

  const cart = await Cart.findOne({ user: req.user._id });

  cart.totalPriceAfterDiscount = (
    cart.totalCartPrice -
    (cart.totalCartPrice * coupon.discount) / 100
  ).toFixed(2);
  await cart.save();

  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});
