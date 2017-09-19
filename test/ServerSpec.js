var expect = require('chai').expect;
var mysql = require('mysql');
var request = require('request');
var httpMocks = require('node-mocks-http');

var app = require('../server/app.js');
var schema = require('../server/db/config.js');
var port = 4568;

/************************************************************/
// Mocha doesn't have a way to designate pending before blocks.
// Mimic the behavior of xit and xdescribe with xbeforeEach.
// Remove the 'x' from beforeEach block when working on
// authentication tests.
/************************************************************/
var xbeforeEach = function() {};
/************************************************************/


describe('', function() {
  var db;
  var server;

  var clearDB = function(connection, tablenames, done) {
    var count = 0;
    tablenames.forEach(function(tablename) {
      connection.query('DROP TABLE IF EXISTS ' + tablename, function() {
        count++;
        if (count === tablenames.length) {
          return schema(db).then(done);
        }
      });
    });
  };

  beforeEach(function(done) {

    /*************************************************************************************/
    /* TODO: Update user and password if different than on your local machine            */
    /*************************************************************************************/
    db = mysql.createConnection({
      user: 'student',
      password: 'student',
      database: 'shortly'
    });

    /**************************************************************************************/
    /* TODO: If you create a new MySQL tables, add it to the tablenames collection below. */
    /**************************************************************************************/
    var tablenames = ['links', 'clicks', 'users', 'sessions'];

    db.connect(function(err) {
      if (err) { return done(err); }
      /* Empties the db table before each test so that multiple tests
       * (or repeated runs of the tests) won't screw each other up: */
      clearDB(db, tablenames, function() {
        server = app.listen(port, done);
      });
    });

    afterEach(function() { server.close(); });
  });

  describe('Database Schema:', function() {
    it('contains a users table', function(done) {
      var queryString = 'SELECT * FROM users';
      db.query(queryString, function(err, results) {
        if (err) { return done(err); }

        expect(results).to.deep.equal([]);
        done();
      });
    });

    it('contains id, username, password columns', function(done) {
      var newUser = {
        username: 'Howard',
        password: 'p@ssw0rd'
      };
      db.query('INSERT INTO users SET ?', newUser, function(err, results) {
        db.query('SELECT * FROM users WHERE username = ?', newUser.username, function(err, results) {
          var user = results[0];
          expect(user.username).to.exist;
          expect(user.password).to.exist;
          expect(user.id).to.exist;
          done();
        });
      });
    });

    it('only allows unique usernames', function(done) {
      var newUser = {
        username: 'Howard',
        password: 'p@ssw0rd'
      };
      db.query('INSERT INTO users SET ?', newUser, function(err, results) {
        var sameUser = newUser;
        db.query('INSERT INTO users SET ?', sameUser, function(err) {
          expect(err).to.exist;
          expect(err.code).to.equal('ER_DUP_ENTRY');
          done();
        });
      });
    });

    it('should increment the id of new rows', function(done) {
      var newUser = {
        username: 'Howard',
        password: 'p@ssw0rd'
      };
      db.query('INSERT INTO users SET ?', newUser, function(error, result) {
        var newUserId = result.insertId;
        var otherUser = {
          username: 'Muhammed',
          password: 'p@ssw0rd'
        };
        db.query('INSERT INTO users SET ?', otherUser, function(err, results) {
          var userId = results.insertId;
          expect(userId).to.equal(newUserId + 1);
          done(error || err);
        });
      });
    });
  });

  xdescribe('Account Creation:', function() {

    it('signup creates a new user record', function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/signup',
        'json': {
          'username': 'Samantha',
          'password': 'Samantha'
        }
      };

      request(options, function(error, res, body) {
        var queryString = 'SELECT * FROM users where username = "Samantha"';
        db.query(queryString, function(err, rows) {
          if (err) { done(err); }
          var user = rows[0];
          expect(user).to.exist;
          expect(user.username).to.equal('Samantha');
          done();
        });
      });
    });

    it('does not store the user\'s original text password', function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/signup',
        'json': {
          'username': 'Samantha',
          'password': 'Samantha'
        }
      };

      request(options, function(error, res, body) {
        if (error) { return done(error); }
        var queryString = 'SELECT password FROM users where username = "Samantha"';
        db.query(queryString, function(err, rows) {
          if (err) { return done (err); }
          var user = rows[0];
          expect(user.password).to.exist;
          expect(user.password).to.not.equal('Samantha');
          done();
        });
      });
    });

    it('redirects to signup if the user already exists', function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/signup',
        'json': {
          'username': 'Samantha',
          'password': 'Samantha'
        }
      };

      request(options, function(error, res, body) {
        if (error) { return done(error); }
        request(options, function(err, response, resBody) {
          if (err) { return done(err); }
          expect(response.headers.location).to.equal('/signup');
          done();
        });
      });
    });

    it('redirects to index after user is created', function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/signup',
        'json': {
          'username': 'Samantha',
          'password': 'Samantha'
        }
      };

      request(options, function(error, res, body) {
        if (error) { return done(error); }
        expect(res.headers.location).to.equal('/');
        done();
      });
    });
  });

  xdescribe('Account Login:', function() {

    beforeEach(function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/signup',
        'json': {
          'username': 'Samantha',
          'password': 'Samantha'
        }
      };

      request(options, function(error, res, body) {
        done(error);
      });
    });

    it('Logs in existing users', function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/login',
        'json': {
          'username': 'Samantha',
          'password': 'Samantha'
        }
      };

      request(options, function(error, res, body) {
        if (error) { return done(error); }
        expect(res.headers.location).to.equal('/');
        done();
      });
    });

    it('Users that do not exist are kept on login page', function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/login',
        'json': {
          'username': 'Fred',
          'password': 'Fred'
        }
      };

      request(options, function(error, res, body) {
        if (error) { return done(error); }
        expect(res.headers.location).to.equal('/login');
        done();
      });
    });

    it('Users that enter an incorrect password are kept on login page', function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/login',
        'json': {
          'username': 'Samantha',
          'password': 'Alexander'
        }
      };

      request(options, function(error, res, body) {
        if (error) { return done(error); }
        expect(res.headers.location).to.equal('/login');
        done();
      });
    });
  });

  xdescribe('Sessions Schema:', function() {
    it('contains a sessions table', function(done) {
      var queryString = 'SELECT * FROM sessions';
      db.query(queryString, function(err, results) {
        if (err) { return done(err); }
        expect(results).to.deep.equal([]);
        done();
      });
    });

    it('contains id, hash, userId columns', function(done) {
      var newSession = {
        hash: 'e98f26e5c90a09e391eee2211b57a61b5dc836d5'
      };
      db.query('INSERT INTO sessions SET ?', newSession, function(error, result) {
        if (error) { return done(error); }
        db.query('SELECT * FROM sessions WHERE hash = ?', newSession.hash, function(err, results) {
          if (err) { return done(err); }
          var session = results[0];
          expect(session.id).to.exist;
          expect(session.userId).to.be.null;
          expect(session.hash).to.equal(newSession.hash);
          done();
        });
      });
    });

    it('should increment the id of new rows', function(done) {
      var newSession = {
        hash: 'e98f26e5c90a09e391eee2211b57a61b5dc836d5'
      };
      db.query('INSERT INTO sessions SET ?', newSession, function(error, result) {
        if (error) { return done(error); }
        var newSessionId = result.insertId;

        var otherSession = {
          hash: 'eba8eb6ec4ede04f2287e67014ccd4c3c070a20f'
        };
        db.query('INSERT INTO sessions SET ?', otherSession, function(err, results) {
          if (err) { return done(err); }
          var sessionId = results.insertId;
          expect(sessionId).to.equal(newSessionId + 1);
          done(err);
        });
      });
    });
  });

  xdescribe('Express Middleware', function() {
    var cookieParser = require('../server/middleware/cookieParser.js');
    var createSession = require('../server/middleware/auth.js').createSession;

    describe('Cookie Parser', function() {

      it('parses cookies and assigns an object of key-value pairs to a session property on the request', function(done) {
        var requestWithoutCookies = httpMocks.createRequest();
        var requestWithCookies = httpMocks.createRequest({
          headers: {
            Cookie: 'shortlyid=8a864482005bcc8b968f2b18f8f7ea490e577b20'
          }
        });
        var requestWithMultipleCookies = httpMocks.createRequest({
          headers: {
            Cookie: 'shortlyid=18ea4fb6ab3178092ce936c591ddbb90c99c9f66; otherCookie=2a990382005bcc8b968f2b18f8f7ea490e990e78; anotherCookie=8a864482005bcc8b968f2b18f8f7ea490e577b20'
          }
        });

        var response = httpMocks.createResponse();

        cookieParser(requestWithoutCookies, response, function() {
          var cookies = requestWithoutCookies.cookies;
          expect(cookies).to.be.an('object');
          expect(cookies).to.eql({});
        });

        cookieParser(requestWithCookies, response, function() {
          var cookies = requestWithCookies.cookies;
          expect(cookies).to.be.an('object');
          expect(cookies).to.eql({ shortlyid: '8a864482005bcc8b968f2b18f8f7ea490e577b20' });
        });

        cookieParser(requestWithMultipleCookies, response, function() {
          var cookies = requestWithMultipleCookies.cookies;
          expect(cookies).to.be.an('object');
          expect(cookies).to.eql({
            shortlyid: '18ea4fb6ab3178092ce936c591ddbb90c99c9f66',
            otherCookie: '2a990382005bcc8b968f2b18f8f7ea490e990e78',
            anotherCookie: '8a864482005bcc8b968f2b18f8f7ea490e577b20'
          });
          done();
        });
      });
    });

    describe('Session Parser', function() {
      it('initializes a new session when there are no cookies on the request', function(done) {
        var requestWithoutCookies = httpMocks.createRequest();
        var response = httpMocks.createResponse();

        createSession(requestWithoutCookies, response, function() {
          var session = requestWithoutCookies.session;
          expect(session).to.exist;
          expect(session).to.be.an('object');
          expect(session.hash).to.exist;
          done();
        });
      });

      it('sets a new cookie on the response when a session is initialized', function(done) {
        var requestWithoutCookie = httpMocks.createRequest();
        var response = httpMocks.createResponse();

        createSession(requestWithoutCookie, response, function() {
          var cookies = response.cookies;
          expect(cookies['shortlyid']).to.exist;
          expect(cookies['shortlyid'].value).to.exist;
          done();
        });
      });

      it('assigns a session object to the request if a session already exists', function(done) {

        var requestWithoutCookie = httpMocks.createRequest();
        var response = httpMocks.createResponse();

        createSession(requestWithoutCookie, response, function() {
          var cookie = response.cookies.shortlyid.value;
          var secondResponse = httpMocks.createResponse();
          var requestWithCookies = httpMocks.createRequest();
          requestWithCookies.cookies.shortlyid = cookie;

          createSession(requestWithCookies, secondResponse, function() {
            var session = requestWithCookies.session;
            expect(session).to.be.an('object');
            expect(session.hash).to.exist;
            expect(session.hash).to.be.cookie;
            done();
          });
        });
      });

      it('creates a new hash for each new session', function(done) {
        var requestWithoutCookies = httpMocks.createRequest();
        var response = httpMocks.createResponse();

        createSession(requestWithoutCookies, response, function() {
          var sessionHashOne = requestWithoutCookies.session.hash;
          var secondRequestWithoutCookies = httpMocks.createRequest();
          var responseTwo = httpMocks.createResponse();

          createSession(secondRequestWithoutCookies, responseTwo, function() {
            var sessionHashTwo = secondRequestWithoutCookies.session.hash;
            expect(sessionHashOne).to.not.equal(sessionHashTwo);
            done();
          });
        });
      });

      it('assigns a username and userId property to the session object if the session is assigned to a user', function(done) {
        var requestWithoutCookie = httpMocks.createRequest();
        var response = httpMocks.createResponse();
        var username = 'BillZito';

        db.query('INSERT INTO users (username) VALUES (?)', username, function(error, results) {
          if (error) { return done(error); }
          var userId = results.insertId;

          createSession(requestWithoutCookie, response, function() {
            var hash = requestWithoutCookie.session.hash;
            db.query('UPDATE sessions SET userId = ? WHERE hash = ?', [userId, hash], function(error, result) {

              var secondResponse = httpMocks.createResponse();
              var requestWithCookies = httpMocks.createRequest();
              requestWithCookies.cookies.shortlyid = hash;

              createSession(requestWithCookies, secondResponse, function() {
                var session = requestWithCookies.session;
                expect(session).to.be.an('object');
                expect(session.user.username).to.eq(username);
                expect(session.userId).to.eq(userId);
                done();
              });
            });
          });
        });
      });

      it('clears and reassigns a new cookie if there is no session assigned to the cookie', function(done) {
        var maliciousCookieHash = '8a864482005bcc8b968f2b18f8f7ea490e577b20';
        var response = httpMocks.createResponse();
        var requestWithMaliciousCookie = httpMocks.createRequest();
        requestWithMaliciousCookie.cookies.shortlyid = maliciousCookieHash;

        createSession(requestWithMaliciousCookie, response, function() {
          var cookie = response.cookies.shortlyid;
          expect(cookie).to.exist;
          expect(cookie).to.not.equal(maliciousCookieHash);
          done();
        });
      });
    });
  });

  xdescribe('Sessions and cookies', function() {
    var requestWithSession;
    var cookieJar;

    var addUser = function(callback) {

      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/signup',
        'json': {
          'username': 'Vivian',
          'password': 'Vivian'
        }
      };

      requestWithSession(options, callback);
    };

    beforeEach(function(done) {
      cookieJar = request.jar();
      requestWithSession = request.defaults({ jar: cookieJar });
      done();
    });

    it('saves a new session when the server receives a request', function(done) {
      requestWithSession('http://127.0.0.1:4568/', function(err, res, body) {
        if (err) { return done(err); }
        var queryString = 'SELECT * FROM sessions';
        db.query(queryString, function(error, sessions) {
          if (error) { return done(error); }
          expect(sessions.length).to.equal(1);
          expect(sessions[0].userId).to.be.null;
          done();
        });
      });
    });

    it('sets and stores a cookie on the client', function(done) {
      requestWithSession('http://127.0.0.1:4568/', function(error, res, body) {
        if (error) { return done(error); }
        var cookies = cookieJar.getCookies('http://127.0.0.1:4568/');
        expect(cookies.length).to.equal(1);
        done();
      });
    });

    it('assigns session to a user when user logs in', function(done) {
      addUser(function(err, res, body) {
        if (err) { return done(err); }
        var cookies = cookieJar.getCookies('http://127.0.0.1:4568/');
        var cookieValue = cookies[0].value;

        var queryString = `
          SELECT users.username FROM users, sessions
          WHERE sessions.hash = ? AND users.id = sessions.userId
        `;

        db.query(queryString, cookieValue, function(error, users) {
          if (error) { return done(error); }
          var user = users[0];
          expect(user.username).to.equal('Vivian');
          done();
        });
      });
    });

    it('destroys session and cookie when logs out', function(done) {
      addUser(function(err, res, body) {
        if (err) { return done(err); }
        var cookies = cookieJar.getCookies('http://127.0.0.1:4568/');
        var cookieValue = cookies[0].value;

        requestWithSession('http://127.0.0.1:4568/logout', function(error, response, resBody) {
          if (error) { return done(error); }

          var cookies = cookieJar.getCookies('http://127.0.0.1:4568/');
          var newCookieValue = cookies[0].value;
          expect(cookieValue).to.not.equal(newCookieValue);

          var queryString = 'SELECT * FROM sessions WHERE hash = ?';
          db.query(queryString, cookieValue, function(error2, sessions) {
            if (error2) { return done(error2); }
            expect(sessions.length).to.equal(0);
            done();
          });
        });
      });
    });
  });

  xdescribe('Privileged Access:', function() {

    it('Redirects to login page if a user tries to access the main page and is not signed in', function(done) {
      request('http://127.0.0.1:4568/', function(error, res, body) {
        if (error) { return done(error); }
        expect(res.req.path).to.equal('/login');
        done();
      });
    });

    it('Redirects to login page if a user tries to create a link and is not signed in', function(done) {
      request('http://127.0.0.1:4568/create', function(error, res, body) {
        if (error) { return done(error); }
        expect(res.req.path).to.equal('/login');
        done();
      });
    });

    it('Redirects to login page if a user tries to see all of the links and is not signed in', function(done) {
      request('http://127.0.0.1:4568/links', function(error, res, body) {
        if (error) { return done(error); }
        expect(res.req.path).to.equal('/login');
        done();
      });
    });
  });

  xdescribe('Link creation:', function() {

    var cookies = request.jar();
    var requestWithSession = request.defaults({ jar: cookies });
    var options = {
      'method': 'POST',
      'followAllRedirects': true,
      'uri': 'http://127.0.0.1:4568/links',
      'json': {
        'url': 'http://www.google.com/'
      }
    };

    xbeforeEach(function(done) {
      var options = {
        'method': 'POST',
        'followAllRedirects': true,
        'uri': 'http://127.0.0.1:4568/signup',
        'json': {
          'username': 'Vivian',
          'password': 'Vivian'
        }
      };
      requestWithSession(options, done);
    });

    afterEach(function(done) {
      requestWithSession('http://127.0.0.1:4568/logout', done);
    });

    describe('Creating new links:', function(done) {

      it('Only shortens valid urls, returning a 404 - Not found for invalid urls', function(done) {
        var options = {
          'method': 'POST',
          'uri': 'http://127.0.0.1:4568/links',
          'json': {
            'url': 'definitely not a valid url'
          }
        };

        requestWithSession(options, function(error, res, body) {
          if (error) { return done(error); }
          expect(res.statusCode).to.equal(404);
          done();
        });
      });

      it('Responds with the short code', function(done) {

        requestWithSession(options, function(error, res, body) {
          if (error) { return done(error); }
          expect(res.body.url).to.equal('http://www.google.com/');
          expect(res.body.code).to.not.be.null;
          done();
        });
      });

      it('New links create a database entry', function(done) {
        requestWithSession(options, function(error, res, body) {
          if (error) { return done(error); }
          db.query('SELECT * FROM links WHERE url = "http://www.google.com/"', function(err, links) {
            var foundUrl;
            if (err) { return done(err); }
            if (links[0] && links[0]['url']) {
              foundUrl = links['0']['url'];
            }
            expect(foundUrl).to.equal('http://www.google.com/');
            done();
          });
        });
      });

      it('Fetches the link url title', function(done) {
        requestWithSession(options, function(error, res, body) {
          if (error) { return done(error); }
          db.query('SELECT * FROM links WHERE title = "Google"', function(err, links) {
            if (err) { return done(err); }
            var foundUrl = links[0];
            expect(foundUrl).to.exist;

            var linkTitle = foundUrl.title;
            expect(linkTitle).to.equal('Google');
            done();
          });
        });
      });
    });

    describe('With previously saved urls:', function() {

      var link;

      beforeEach(function(done) {
        // save a link to the database
        link = {
          url: 'http://www.google.com/',
          title: 'Google',
          baseUrl: 'http://127.0.0.1:4568',
          code: '2387f'
        };
        db.query('INSERT INTO links SET ?', link, done);
      });

      it('Returns the same shortened code', function(done) {
        var options = {
          'method': 'POST',
          'followAllRedirects': true,
          'uri': 'http://127.0.0.1:4568/links',
          'json': {
            'url': 'http://www.google.com/'
          }
        };

        requestWithSession(options, function(error, res, body) {
          if (error) { return done(error); }
          var code = res.body.code;
          expect(code).to.equal(link.code);
          done();
        });
      });

      it('Shortcode redirects to correct url', function(done) {
        var options = {
          'method': 'GET',
          'uri': 'http://127.0.0.1:4568/' + link.code
        };

        requestWithSession(options, function(error, res, body) {
          if (error) { return done(error); }
          var currentLocation = res.request.href;
          expect(currentLocation).to.equal('http://www.google.com/');
          done();
        });
      });

      it('Shortcode redirects to index if shortcode does not exist', function(done) {
        var options = {
          'method': 'GET',
          'uri': 'http://127.0.0.1:4568/doesNotExist'
        };

        requestWithSession(options, function(error, res, body) {
          if (error) { return done(error); }
          var currentLocation = res.request.href;
          expect(currentLocation).to.equal('http://127.0.0.1:4568/');
          done();
        });
      });

      it('Returns all of the links to display on the links page', function(done) {
        var options = {
          'method': 'GET',
          'uri': 'http://127.0.0.1:4568/links'
        };

        requestWithSession(options, function(error, res, body) {
          if (error) { return done(error); }
          expect(body).to.include('"title":"Google"');
          expect(body).to.include('"code":"' + link.code + '"');
          done();
        });
      });
    });
  });
});
