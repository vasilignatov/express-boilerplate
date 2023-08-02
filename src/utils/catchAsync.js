const catchAsync = (cb) => {
    return (req, res, next) => {
        Promise
            .resolve(cb(req, res, next))
            .catch(next);
    }
}

module.exports = catchAsync;