const express = require('express');
const reviewRouter = require('./../routes/reviewRoutes');
const router = express.Router();
const {
  aliasTopTours,
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} = require('../controllers/tourController');

const { protect, restrictTo } = require('./../controllers/authController');

//nested tour->review route
router.use('/:tourId/reviews', reviewRouter);

// router.param('id', checkId);
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getTourStats);

router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);
// router.get('/distances/:latlng/unit/:unit', getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(protect, restrictTo('admin', 'lead-guide'), updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
