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


var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google').Strategy;

var FACEBOOK_APP_ID= "102295256632865";
var FACEBOOK_APP_SECRET = "18bb50350b469fa3ae018acd6dc4fff9";

var TWITTER_CONSUMER_KEY= "IEv4ktjCYIjMpYOWDRj0w";
var TWITTER_CONSUMER_SECRET= "cnSUcInpbqdXVr9MYVEoMMuDfequXG0RmOp6Z3vlmo";

// Set configuration context
app.config = config[app.settings.env];

// Connect to MongoDB
var db = mongoose.connect(app.config.database.uri);

// Auth setup
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    process.nextTick(function () {
      console.log("Username = " + profile.displayName);
      return done(null, profile);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      console.log("Username = " + profile.displayName);
      return done(null, profile);
    });
  }
));

passport.use(new GoogleStrategy({
    returnURL: 'http://localhost:3000/auth/google/return',
    realm: 'http://localhost:3000/'
  },
  function(identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user. In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));

app.configure(function(){
  app.set('port', process.env.PORT || app.config.port);
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
  app.use(express.cookieParser(app.config.session.secret));
  app.use(express.session({
    secret: app.config.session.secret,
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

app.get('/', function(req, res, next) {
  res.render('layout', {
    title: 'title'
  });
});


//Facebook auth
app.get('users/actions', function(req, res){
  res.render('actions', { user: req.user });
});
app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
  });

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

//Twitter Auth
app.get('/auth/twitter',
  passport.authenticate('twitter', { failureRedirect: '/login'}),
  function(req, res){
    res.redirect('/');
  });

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

//Google Auth
app.get('/auth/google',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });
app.get('/auth/google/return',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
app.server = http.createServer(app);

helpers.loadModels(db);
helpers.loadRoutes(app, db);

app.server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
