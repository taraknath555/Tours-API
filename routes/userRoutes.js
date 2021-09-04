const express = require('express');

const router = express.Router();
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
} = require('../controllers/userController');

const {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
  restrictTo,
} = require('./../controllers/authController');

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:resetToken').patch(resetPassword);

//protect all routes after this middleware
router.use(protect);

router.route('/updateMyPassword').patch(updatePassword);

router.route('/me').get(getMe, getUser);
router.route('/updateMe').patch(updateMe);
router.route('/deleteMe').delete(deleteMe);

//restricted to only admin access after this route
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
