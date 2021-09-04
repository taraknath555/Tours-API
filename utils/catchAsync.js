module.exports = (fn) => {
  //return same function wrapping it
  return (req, res, next) => {
    // fn.(req,res,next).catch(err => next(err))
    fn(req, res, next).catch(next);
  };
};
