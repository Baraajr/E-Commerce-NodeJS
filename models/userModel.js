const crypto = require('crypto');

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'name required'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'email required'],
      unique: true,
      lowercase: true,
    },
    phone: String,
    profileImg: { type: String },
    password: {
      type: String,
      required: [true, 'password required'],
      minlength: [6, 'Too short password'],
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: ['user', 'manager', 'admin'],
      default: 'user',
    },
    active: {
      type: Boolean,
      default: true,
    },
    //child reference
    wishlist: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
      },
    ],
    addresses: [
      {
        id: mongoose.Schema.Types.ObjectId,
        alias: String,
        details: String,
        phone: String,
        city: String,
        postalCode: String,
      },
    ],
  },
  { timestamps: true },
);

// check if two password are correct
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  if (!candidatePassword || !userPassword) {
    throw new Error('Password values cannot be undefined');
  }
  return await bcrypt.compare(candidatePassword, userPassword);
};

// check if the user changed the password after a given time
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp; // if true then the password has been changed after jwt token was issued
  }
  // false means not changed
  return false;
};

// create a random code and save hashed version into db
userSchema.methods.createPasswordResetCode = function () {
  //create random code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  //hash the code
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  // save relative data to db
  this.passwordResetCode = hashedResetCode;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  this.passwordResetVerified = false;

  return resetCode;
};

// Hashing user password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

//update passwordChangedAt field
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
}); //this.isNew  means the new document (user)

// respond only with active users
userSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});

// send the image url in the response
const setImageURL = (doc) => {
  if (doc.profileImg) {
    const imageUrl = `${process.env.BASE_URL}/users/${doc.profileImg}`;
    doc.profileImg = imageUrl;
  }
};
// findOne, findAll and update
userSchema.post('init', (doc) => {
  setImageURL(doc);
});

// create
// after saving to the database we send the image url back
userSchema.post('save', (doc) => {
  setImageURL(doc);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
