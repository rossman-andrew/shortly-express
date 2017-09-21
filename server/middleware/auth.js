const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // if req.cookie.shortyid exists,
    // assign req.session.hash to req.cookies.shortyid.hash
    // look up hash in hash databse and grab userID
    // update req.session.user.username/userID with userid/username found FROM database
  if (req.cookies.shortlyid) {
    var hash = req.cookies.shortlyid;
    // console.log('hash', hash);
    models.Sessions.get({ hash })
      .then((sessionData) => {
        req.session = sessionData;
        var id = sessionData.userId;
        
        console.log('userID', sessionData.userId);
        models.Users.get({ id })
          .then((userData) => {
            // now we have username associated with id of session
            req.session.user = { username: userData.username };
            res.cookie('shortlyid', req.session.hash);
            next();
          });
      });
  } else {
    // models.Sessions.create()
    //   .then((data) => {
    //     var username = req.body.username;
    //     var hash = data.hash;
    //     console.log('created hash', hash);
    //     models.Users.get({ username })
    //       .then((userData) => {
    //         var userId = userData.id;
    //         return models.Sessions.update({ id }, { userId })      
    //       });
    //     })
    //   .then
    //     models.Sessions.get({ id })
    //       .then((data) => {
    //         req.session = data;
    //         res.cookie('shortlyid', req.session.hash);
    //         next();
    //       });
    //     });
  
  }

  // look at req.cookies
    // if req.cookie.shortlyid does not exist,
        // then create session
        // assign req.session with new session
    // assign res.cookie with req.session 





  // if session hash is already in session table
    // let req.session.user.username = username associated with userId
    // let req.session.userId = userId

};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

