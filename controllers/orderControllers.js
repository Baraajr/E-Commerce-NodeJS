const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const factory = require('./handlerFactory');
const User = require('../models/userModel');

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

  if (order) {
    const bulkOptions = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: item.quantity } },
      },
    }));

    await Product.bulkWrite(bulkOptions);
    //5)clear cart
    await Cart.findByIdAndDelete(req.params.cartId);
  }
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

const createOrder = async (session) => {
  try {
    const cartId = session.client_reference_id;
    const shippingAddress = session.metadata;
    const orderPrice = session.amount_total / 100;

    const cart = await Cart.findById(cartId);
    const user = await User.findOne({ email: session.customer_email });

    if (!cart || !user) {
      throw new Error('Cart or user not found');
    }

    const order = await Order.create({
      user: user._id,
      cartItems: cart.cartItems,
      totalOrderPrice: orderPrice,
      shippingAddress,
      isPaid: true,
      paidAt: Date.now(),
      paymentMethodType: 'card',
    });

    //update product quantity and sold fields
    if (order) {
      const bulkOptions = cart.cartItems.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { quantity: -item.quantity, sold: item.quantity } },
        },
      }));

      await Product.bulkWrite(bulkOptions);

      //clear cart
      await Cart.findByIdAndDelete(cartId);
    }
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

//will work only if the app is deployed
exports.webhookCheckout = catchAsync(async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error('Stripe webhook error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      await createOrder(event.data.object);
    }

    res.status(200).json({ message: 'order created' });
  } catch (error) {
    console.error('Error in webhookCheckout:', error);
    res.status(400).json({ message: error });
  }
});
