const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const { getAll, getOne, updateOne, deleteOne } = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update. Please use /updateMyPassword',
        400
      )
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Please use /signup for this',
  });
};
exports.getAllUsers = getAll(User);
exports.getUser = getOne(User);
exports.updateUser = updateOne(User); //admin: do not update user's password using this route
exports.deleteUser = deleteOne(User);
