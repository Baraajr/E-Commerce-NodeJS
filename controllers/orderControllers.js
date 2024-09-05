const stripe = require('stripe')(
  'sk_test_51PvGTwLTozjnFlAKCEnpT0cKOpsBwOwlXDhHxw2HS39rdZljRULDFwNmq7zcZbTV8vkIwuxk5bMvtBwt3FFXu3Sv00LT7lq0N8',
);

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const factory = require('./handlerFactory');

exports.createCashOrder = catchAsync(async (req, res, next) => {
  const taxPrice = 0;
  const shippingPrice = 0;
  //1)get the cart using cartId
  const cart = await Cart.findById(req.params.cartId);
  if (!cart) return next(new AppError('There is no cart with this id', 404));

  //2)get total price from cart first check if coupon applied
  const cartPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalCartPrice;

  const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

  //3)create order with cash method
  const order = await Order.create({
    user: req.user._id,
    cartItems: cart.cartItems,
    totalOrderPrice,
    shippingAddress: req.body.shippingAddress,
  });

  //4)after creating order decrease the product quantity and increase the sold field in the product
  // cart.cartItems.forEach(async (item) => {
  //   const product = await Product.findByIdAn(item.product);
  //   product.quantity -= item.quantity;
  //   product.sold += item.quantity;
  //   await product.save();
  // });

  const bulkOptions = cart.cartItems.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { quantity: -item.quantity, sold: item.quantity } },
    },
  }));

  await Product.bulkWrite(bulkOptions);
  //5)clear cart
  await Cart.findByIdAndDelete(req.params.cartId);

  res.status(200).json({
    status: 'success',
    data: order,
  });
});

exports.filterOrdersForLoggedUser = catchAsync(async (req, res, next) => {
  if (req.user.role === 'user')
    req.filterObj = {
      user: req.user._id,
    };
  next();
});

exports.getAllOrders = factory.getAll(Order);

exports.getOrder = factory.getOne(Order);

exports.updateOrderPaidStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) return next(new AppError('There is no order with this id', 404));

  order.isPaid = true;
  order.paidAt = Date.now();

  const updatedOrder = await order.save();

  res.status(200).json({
    status: 'success',
    data: updatedOrder,
  });
});

exports.updateOrderDeliveredStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) return next(new AppError('There is no order with this id', 404));

  order.isDelivered = true;
  order.deliveredAt = Date.now();

  const updatedOrder = await order.save();

  res.status(200).json({
    status: 'success',
    data: updatedOrder,
  });
});

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const taxPrice = 0;
  const shippingPrice = 0;
  const cart = await Cart.findById(req.params.cartId);

  if (!cart) {
    return next(new AppError('No cart found with that ID', 404));
  }

  const cartPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalCartPrice;

  const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'egp',
          product_data: {
            name: `Order for ${req.user.name}`,
          },
          unit_amount: Math.round(totalOrderPrice * 100), // Stripe expects the amount in the smallest currency unit
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/orders`,
    cancel_url: `${req.protocol}://${req.get('host')}/cart`,
    customer_email: req.user.email,
    client_reference_id: cart.id,
    metadata: req.body.shippingAddress,
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});
