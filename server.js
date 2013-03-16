
var cdn       = require('express-cdn');
var config    = require('./config');
var flash     = require('connect-flash');
var cons      = require('consolidate');
var dust      = require('dustjs-linkedin');
var express   = require('express');
var validator = require('express-validator');
var finder    = require('findit');
var helpers   = require('./helpers');
var http      = require('http');
var mongoose  = require('mongoose');
var passport  = require('passport');
var path      = require('path');
var redis     = require('redis').createClient();

var app        = express();
var RedisStore = require('connect-redis')(express);

// Set configuration context
config = config[app.settings.env];

// Connect to MongoDB
var db = mongoose.connect(config.database.uri);

app.configure(function(){
  app.set('port', process.env.PORT || config.port);
  app.set('views', __dirname + '/views');
  // Setup Dust.js templating engine.
  app.engine('dust', cons.dust);  
  app.set('view engine', 'dust');
  // Enable pjax support
  app.use(helpers.pjaxSupport());
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(validator);
  app.use(express.methodOverride());
  app.use(express.cookieParser(config.session.secret));
  app.use(express.session({
    secret: config.session.secret,
    store: new RedisStore({
      client: redis
    })
  }));
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  // Expose user to templating.
  app.use(helpers.exposeUser);
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  dust.optimizers.format = function(ctx, node) { return node };
  app.locals.now = (new Date()).getTime();
  app.use(express.errorHandler({
    dumbExceptions: true,
    showStack: true
  }));
});

helpers.loadModels(db);
helpers.loadRoutes(app, db);

app.get('/', function(req, res, next) {
  res.render('layout', {
    title: 'title'
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});