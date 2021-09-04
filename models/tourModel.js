const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      minLength: [10, 'A tour name must have equal or more then 10 characters'],
      maxLength: [30, 'A tour name must have equal or less than 30 characters'],
      // validate: [validator.isAlpha, 'Tour name must contain alphabets only'],
      //OR
      // validate: {
      //   validator: validator.isAlpha,
      //   message: 'Tour name must contain alphabets only',
      // },
    },
    slug: String,
    duration: {
      type: String,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either of easy, medium, diffucult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings must be equal or above 1.0'],
      max: [5, 'Ratings must be equal or below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current document on new document creation.
          //Not works while updating document
          return val < this.price;
        },
        message: 'Discount price {VALUE} should be less then regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'A tour must have a discription'],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        description: String,
        day: Number,
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//indexing
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
//Virtual Property
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Virtual referencing
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//Mongoose Middleware

//----> 1.Document Middleware

//pre-save hook: runs before save() and create() mongoose method only
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//Embedding tour-guides
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

//post-save hook
tourSchema.post('save', function (doc, next) {
  // console.log(doc);
  next();
});

//----> 2.Query Middleware

//pre-find hook
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -active',
  });
  next();
});

//post-find hook
tourSchema.post(/^find/, function (doc, next) {
  const timeTaken = Date.now() - this.start;
  // console.log(`Query tooks: ${timeTaken} miliseconds`);
  next();
});

//----> 3.Aggregation Middleware

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
