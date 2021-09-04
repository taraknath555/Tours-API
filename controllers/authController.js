const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = async (id) => {
  return await promisify(jwt.sign)({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = await signToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  //only set to undefined not save so not visible to output only
  //still persist in Database
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    photo: req.body.photo,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  await createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide your email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  await createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //getting token and check if it is there or not
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    //req.headers.authorization - Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjOGEyMGQzMmY4ZmI4MTRiNTZmYTE4NyIsImlhdCI6MTYzMDIwOTc3MCwiZXhwIjoxNjM3OTg1NzcwfQ.KxJWGuODoYXjntY9gqJeyrVJLE_LmYelWEfTSTljZzI
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in, Please login first', 401));
  }

  //varification of token
  //decoded - { id: '5c8a20d32f8fb814b56fa187', iat: 1630209770, exp: 1637985770 }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('User belonging to this token no longer exist', 401)
    );
  }

  //check if user change password after token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'You Changed your password recently, Please login again',
        401
      )
    );
  }

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    return next(
      new AppError('Please provide your email to reset the password', 400)
    );
  }

  const user = await User.findOne({
    email: req.body.email,
  });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forget your password? Submit a patch request with your 
new password and passwordConfirm to: ${resetURL}\n
If you don't forget your password please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token (valid for 10 min minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token send to email',
    });
  } catch (err) {
    user.createPasswordResetToken = undefined;
    user.passwordResetTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email, Please try again later',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpire = undefined;
  await user.save();

  await createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, passwordConfirm } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!currentPassword) {
    return next(new AppError('Please provide your current password', 400));
  }

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  await createSendToken(user, 200, res);
});
