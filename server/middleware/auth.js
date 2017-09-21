const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // if req.cookie.shortyid exists,
    // assign req.session.hash to req.cookies.shortyid.hash
    // look up hash in hash databse and grab userID
    // update req.session.user.username/userID with userid/username found FROM database
  if (req.cookies.shortlyid) {
    var hash = req.cookies.shortlyid;
    models.Sessions.get({ hash })
      .then((sessionData) => {
        if (sessionData) {
          req.session = sessionData;
          res.cookie('shortlyid', req.session.hash);
          var id = sessionData.userId;
          if (id) {
            req.session.userId = id;
            models.Users.get({ id })
              .then((userData) => {
                // now we have username associated with id of session
                req.session.user = { username: userData.username };
                next();  
              });
          } else { // when userId is null
            next();
          }
        } else {
          // reassign res.cookie() with new cookie
          models.Sessions.create()
            .then((sessionData) => {
              req.session = sessionData;      
              res.cookie('shortlyid', req.session.hash);
              next();
            });
        }
      });
  } else {
    models.Sessions.create()
      .then((data) => {
        var id = data.insertId;
        return models.Sessions.get({ id });
      })
      .then((sessionData) => {
        req.session = sessionData;      
        res.cookie('shortlyid', req.session.hash);
      })
      .then(() => {
        var username = req.body.username;
        req.session.user = { username };
        return models.Users.get({ username });
      })
      .then((userData) => {
        if (userData && userData.id) {
          req.session.userId = userData.id;
        }
        next();
      });
  // look at req.cookies
    // if req.cookie.shortlyid does not exist,
        // then create session
        // assign req.session with new session
    // assign res.cookie with req.session 
  }

};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

