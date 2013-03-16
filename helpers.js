var finder    = require('findit');
var path      = require('path');
var Validator = require('validator').Validator;

exports.STATUS_CODES = {
  UNPROC_ENTITY: 422,
  BAD_REQUEST:   400,
  CREATED:       201,
  CONFLICT:      409,
  OK:            200
};

exports.pjaxSupport = function() {
  return function(req, res, next) {
    if (req.header('X-PJAX')) {
      res.locals.pjax = true;
    }

    next();
  }
};

exports.generateValidator = function() {
  var val = new Validator();
  v.error = function(msg) {
    if ('undefined' === typeof this._validationErrors) {
      this._validationErrors = {};
    }
  }
};

exports.getFormat = function(req) {
  return ('string' === typeof req.params.format ? req.params.format : '');
};

exports.loadFiles = function(directory, callback) {
  var directory = path.join(__dirname, directory);
  var files = finder.sync(directory);
  for (var i = 0; i < files.length; i++) {
    callback(files[i]);
  }
};

exports.loadModel = function(db) {
  return function(file) {
    require(file).boot(db);
  }
};

exports.loadRoute = function(app, db) {
  return function(file) {
    require(file).boot(app, db);
  }
};

exports.loadModels = function(db) {
  exports.loadFiles('models', exports.loadModel(db));
};

exports.loadRoutes = function(app, db) {
  exports.loadFiles('routes', exports.loadRoute(app, db));
};

exports.pjaxTitle = function(title, req, res) {
  if (req.header('X-PJAX')) { res.setHeader('X-PJAX-TITLE', title); }
};

exports.getRoute = function(template, options) {
  return function(errors) {
    return function(req, res, next) {
      options.errors = (errors ? errors   : {});
      options.values = (errors ? req.body : {});
      exports.pjaxTitle(options.title, req, res);
      res.render(template, options);
    };
  };
};

exports.redirectUser = function(url) {
  return function(req, res, next) {
    if (req.user) {
      return res.redirect(url);
    }
    next();
  };
};

exports.redirectGuest = function(sourceUrl, toRoute) {
  return function(req, res, next) {
    if (!req.user) {
      console.log('here');
      req.flash('info', 'You must be logged in to do that.');
      res.locals({ redirect: sourceUrl, message: req.flash('info') });
      return toRoute(req, res, next);
    }
    next();
  };
};

exports.exposeUser = function(req, res, next) {
  res.locals.user = req.user;
  next();
};

// @TODO: Ugh
exports.respond = function(format, status, result, error, errorCallback) {
  return function(req, res, next) {
    var format   = format || '';
    // @TODO: make sure redirect is in local space.
    var redirect = req._redirect || '/'; 

    if (format === 'json') {
      var status = status || 404;
      var response;
      if ('undefined' !== typeof value && value !== null) {
        status = (status !== 404 ? status : 200);
        if ('undefined' !== typeof error || error !== null) {
          response = result;
        }
      }
      res.status(status);
      if ('undefined' !== typeof error  && error !== null ||
          'undefined' !== typeof result && result !== null) {
        res.json({
          error: error || false,
          response: response || false
        });
      } else {
        res.end();
      }
    } else {
      if ('undefined' !== typeof error && error !== null) {
        res.locals({ redirect: redirect });
        if ('function' === typeof errorCallback) { 
          errorCallback(req, res, next);
        } else {
          res.redirect(redirect);
        }
      } else {
        res.redirect(redirect);
      }
    }
  };
};