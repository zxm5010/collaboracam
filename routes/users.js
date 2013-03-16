var helpers   = require('../helpers');
var validator = require('validator');
var check     = validator.check;
var sanitize  = validator.sanitize;
var passport  = require('passport');

/**
 * Get Routes
 */

exports.GetRoutes = {
  signUp:   helpers.getRoute('users/actions', { title: 'Sign Up', register: true}),
  login:    helpers.getRoute('users/actions', { title: 'Sign In', login: true}),
  recovery: helpers.getRoute('users/recovery', { title: 'Lost your password?' })
};

function postLoginRoute(db) {
  return function(req, res, next) {
    var errors;
    var format = helpers.getFormat(req);

    req._redirect = req.body.redirect || '/'; 

    req.assert(
      'login', 
      'This field cannot be blank.'
    ).len(4, 32);

    req.assert(
      'login-password', 
      'Your chosen password must be between 6 and 64 characters.'
    ).len(6, 64);

    errors = req.validationErrors(true);

    if (errors) {
      helpers.respond(
        format,
        helpers.STATUS_CODES.UNPROC_ENTITY,
        null,
        errors,
        exports.GetRoutes.login(errors)
      )(req, res, next);
    } else {
      req.sanitize('login').trim();
      req.sanitize('login-password').trim();

      passport.authenticate('local', function(err, userResult, info) {
        if (err) { return next(err); }
        if (!userResult) {
          errors = {};
          errors['login'] = {
            param: 'login',
            msg:   'Your chosen username or email does not exist.',
            value: req.body.login
          };

          helpers.respond(
            format,
            helpers.STATUS_CODES.UNPROC_ENTITY,
            null,
            errors,
            exports.GetRoutes.login(errors)
          )(req, res, next);
        } else {
          req.logIn(userResult, function(err) {
            if (err) { return next(err); }
            helpers.respond(
              format,
              helpers.STATUS_CODES.OK,
              userResult,
              null,
              null
            )(req, res, next);
          });
        }
      })(req, res, next);
    }
  }
}

function postRegistrationRoute(db) {
  return function(req, res, next) {
    var errors;
    var format = helpers.getFormat(req);
    var User   = db.model('User');

    req._redirect = req.body.redirect || '/'; 
    
    /**
     * Validate incoming data.
     */

    req.assert(
      'email', 
      'Please enter in a valid email address.'
    ).isEmail();

    req.assert(
      'username', 
      'Your chosen username must be between 4 and 64 characters.'
    ).len(4, 64);

    req.assert(
      'password',
      'Your chosen password must be between 6 and 64 characters.'
    ).len(6, 64);

    errors = req.validationErrors(true);

    if (errors) {
      helpers.respond(
        format, 
        helpers.STATUS_CODES.UNPROC_ENTITY, 
        null, 
        errors,
        exports.GetRoutes.signUp(errors)
      )(req, res, next);
      //function(format, status, result, error, redirect, errorCallback)
    } else {
      User.find({
        $or: [ { nickname: req.body.username }, { email: req.body.email } ] 
      }, function checkForDuplicateUser(err, userResults) {
        if (err) { return next(err); } 

        if (userResults.length > 0) {
          errors = {};
          for (var i = 0; i < userResults.length; i++) {
            if (userResults[i].nickname === req.body.username) {
              errors['username'] = {
                param: 'username',
                msg:   'Someone already has the username that you picked.',
                value: req.body.username
              };
            }

            if (userResults[i].email === req.body.email) {
              errors['email'] = {
                param: 'email',
                msg:   'Someone already has the email address that you picked.',
                value: req.body.email
              };
            }
          }
          helpers.respond(
            format,
            helpers.STATUS_CODES.CONFLICT,
            null,
            errors,
            exports.GetRoutes.signUp(errors)
          )(req, res, next);
        } else {
          var newUser      = new User();
          newUser.email    = sanitize(req.body.email).trim().toLowerCase();
          newUser.password = sanitize(req.body.password).trim();
          newUser.nickname = sanitize(req.body.username).trim();

          newUser.save(function saveNewUser(err) {
            if (err) { return next(err); }
            req.logIn(newUser, function logInUser(err) {
              if (err) { return next(err); }
              helpers.respond(
                format,
                helpers.STATUS_CODES.CREATED,
                newUser,
                null,
                null
              )(req, res, next);
            });
          });
        }
      });
    }
  };
}

exports.boot = function(app, db) {
  var User      = db.model('User');

  app.get('/signup', helpers.redirectUser('/browse'), exports.GetRoutes.signUp());
  app.get('/login', helpers.redirectUser('/browse'), exports.GetRoutes.login());
  app.get('/users/recovery', exports.GetRoutes.recovery());
  app.get('/logout', function(req, res, next) { req.logOut(); res.redirect('/'); });

  app.post('/signup', helpers.redirectUser('/browse'), postRegistrationRoute(db));
  app.post('/login', helpers.redirectUser('/browse'), postLoginRoute(db));
};