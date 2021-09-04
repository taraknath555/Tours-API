const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    select: false,
    minLength: [8, 'Password must be greater than 8 characters'],
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'Passwords must be equal',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetTokenExpire: {
    type: Date,
    select: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

//pre-save hook, runs before any user document save to database
//Encrypt password
//only runs for save and create (Not for update))
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

//pre-save hook, runs before any user document save to database
//set password change in database
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//pre-find hook, runs before any find query executes
//filter out user document that has active property set to false

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//method available to evry user document
//return false to restrict user to access protected routes if user
//changes password recently and not log in again
userSchema.methods.changePasswordAfter = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changeTimeStamp = this.passwordChangedAt.getTime() / 1000;
    return changeTimeStamp > jwtTimeStamp;
  }
  return false;
};

//method available to evry user document
//create reset token and reset token expires time and saves
//the encrypted form of token in database and return raw token
//to send it to user email to reset password
userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.passwordResetTokenExpire = Date.now() + 10 * 60 * 1000;
  return token;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
