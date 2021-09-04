const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const app = express();

//Set security HTTP headers
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit request from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, Please try again in an hour!',
});
app.use('/api', limiter);

//Body parser, Reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));

//Data Sanitization against NOSQL query injection
app.use(mongoSanitize());

//Data Sanitization against xss
app.use(xss());

//Serving static files
// app.use(express.static(`${__dirname}/public`));

//Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//Global error handler
app.use(globalErrorHandler);

module.exports = app;
