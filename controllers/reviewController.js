const Review = require('./../models/reviewModel');
const {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user;
  if (!req.body.tour) req.body.tour = req.params.tourId;
  next();
};

exports.getAllReview = getAll(Review);
exports.getReview = getOne(Review);
exports.createReview = createOne(Review);
exports.updateReview = updateOne(Review);
exports.deleteReview = deleteOne(Review);
