const models = require('../models');
const auth = require('./auth');


const parseCookies = (req, res, next) => {

  var cookieObj = {};
  
  // parse existing cookies
  if (req.headers.cookie) {
    var cookies = req.headers.cookie.split('; ');
    cookies.forEach((cookie) => {
      var cookieArr = cookie.split('=');
      cookieObj[cookieArr[0]] = cookieArr[1];
    });
  }

  req.cookies = cookieObj;
  next();  
};

module.exports = parseCookies;