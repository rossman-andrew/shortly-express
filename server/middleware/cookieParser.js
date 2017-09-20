const parseCookies = (req, res, next) => {
  // access cookie from request
  // if valid, parse them into an object
  // assign to cookies property on the request
  console.log('trying to find cookie', req, req.body.cookies);

};

module.exports = parseCookies;