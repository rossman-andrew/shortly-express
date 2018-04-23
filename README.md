# shortly-express
This is a project I completed as a student at [hackreactor](http://hackreactor.com). This project was worked on with a pair.

Get ready for full-stack app development with Shortly! Shortly is a URL shortener service similar to Bitly - but is only partially finished. Your goal is to build out an authentication system and other features that will enable users to have their own private set of shortened URLs.

While some aspects of the authentication system have been provided, you will need to think about how to approach authentication from both a user perspective and a technical perspective. Some questions to think about:
* What additional steps will the user need to take when interacting with the application? More specifically, what additional routes will the application need to handle?
* What strategies do I need to employ to secure existing site functionality?
* How often should the user need to enter their username + password?

## What's in this Repo
This repo contains a functional URL shortener designed as a single page app. It's built using Backbone.js on the client with a Node/Express-based server, which uses EJS for server-side templates.

It uses MySQL, an open-source relational database management system (RDBMS).

Server side, the repo also uses express 4. There are a few key differences between express 3 and 4, foremost that middleware is no longer included in the express module, but must be installed separately.

Client side, the repo includes libraries like jQuery, underscore.js and Backbone.js. Templating on the client is handled via Handlebars.

This repo includes some basic server specs using Mocha. It is your job to make all of them pass, but feel free to write additional tests to guide yourself. Enter npm test to run the tests.

Use nodemon so that the server automatically restarts when you make changes to your files. To see an example, use npm start, but see if you can improve on this.

## How to use the provided code
This repo contains many lines of provided code, and spending too much time reading this code will make it hard for you to complete the sprint. You should not need to inspect the client side code to complete the bare minimum requirements. You will need to use methods in server/models/ and server/lib/. Documentation for these methods has been provided in the docs/ directory - just open docs/index.html in your browser. Note: the documentation is generated as part of the postinstall npm script - so if you haven't run npm install yet, the docs will not be available.

## Reference Material
* [Express 4 API](http://expressjs.com/en/4x/api.html)
* [Sessions and Security](http://guides.rubyonrails.org/security.html) - this is a Rails resource, but it's a really good explanation.
* [Node cypto Module](https://nodejs.org/api/crypto.html)
* [How does a web session work?](https://machinesaredigging.com/2013/10/29/how-does-a-web-session-work/)
* [What is a cookie?](https://www.youtube.com/watch?v=I01XMRo2ESg)
* [How does cookie-based authentication work?](https://stackoverflow.com/questions/17769011/how-does-cookie-based-authentication-work)
* [Beginner's guide to REST](https://code.tutsplus.com/tutorials/a-beginners-guide-to-http-and-rest--net-16340)
* [REST and RESTful responses](https://pixelhandler.com/posts/develop-a-restful-api-using-nodejs-with-express-and-mongoose)

## Your Goals
**Bare Minimum Requirements** 
Build a simple session-based server-side authentication system - from scratch. Use the tests in test/ServerSpec.js and the following outline to guide you in your implementation.

**Usernames and passwords**
The database table, users, and it's corresponding model have been provided. Use this to store usernames and passwords. The model includes useful methods for encrypting and comparing your passwords.
* Add routes to your Express server to process incoming POST requests. These routes should enable a user to register for a new account and for users to log in to your application. Take a look at the login.ejs and signup.ejs templates in the views directory to determine which routes you need to add.
* Add the appropriate callback functions to your new routes. Add methods to your user model, as necessary, to keep your code modular (i.e., your database model methods should not receive as arguments or otherwise have access to the request or response objects).

**Sessions and cookies**
You will be writing two custom middleware functions to configure your Express server. The first will be a cookie parser and the second will be a session generator. Though Express has its own middleware packages named cookie-parser and express-session, you will be building this functionality from scratch (read as: you should not be using the cookie-parser and express-session middleware packages anywhere in your code). The database table, sessions, has been provided as a place to store your generated session hashes.
* In middleware/cookieParser.js, write a middleware function that will access the cookies on an incoming request, parse them into an object, and assign this object to a cookies property on the request.
* In middleware/auth.js, write a createSession middleware function that accesses the parsed cookies on the request, looks up the user data related to that session, and assigns an object to a session property on the request that contains relevant user information. (Ask yourself: what information about the user would you want to keep in this session object?)
* Things to keep in mind:
  * An incoming request with no cookies should generate a session with a unique hash and store it the sessions database. The middleware function should use this unique hash to set a cookie in the response headers. (Ask yourself: How do I set cookies using Express?).
  * If an incoming request has a cookie, the middleware should verify that the cookie is valid (i.e., it is a session that is stored in your database).
  * If an incoming cookie is not valid, what do you think you should do with that session and cookie?
* Mount these two middleware functions in app.js so that they are executed for all requests received by your server.

**Authenticated Routes**
* Add a verifySession helper function to all server routes that require login, redirect the user to a login page as needed. Require users to log in to see shortened links and create new ones. Do NOT require the user to login when using a previously shortened link.
* Give the user a way to log out. What will this need to do to the server session and the cookie saved to the client's browser?

**Tests**
Write at least 3 new meaningful tests inside of test/ServerSpec.js

![Project Demo Image](https://cloud.githubusercontent.com/assets/15180/5589513/5fbb5070-90d5-11e4-8333-eb45c3b84048.gif)