var bcrypt    = require('bcrypt');
var passport      = require('passport');
var passportLocal = require('passport-local');

exports.boot = function(db) {
  var LocalStrategy = passportLocal.Strategy;
  var User = new db.Schema({
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      index: true
    },
    nickname: {
      type: String,
      required: true,
      min: 4,
      max: 32
    },
    nickname_lc: {
      type:   String,
      unique: true,
      index:  true
    },
    hash:    String,
    salt:    String
  });

  User.virtual('password').get(function() {
    return _this.password;
  }).set(function(password) {
    var salt = this.salt = bcrypt.genSaltSync(10);
    this._password = password;
    this.hash = bcrypt.hashSync(password, salt);
  });

  User.method('isValidPassword', function(password, callback) {
    bcrypt.compare(password, this.hash, callback);
  });

  User.pre('save', function(next) {
    this.nickname_lc = this.nickname.toLowerCase();
    next();
  });

  passport.use(new LocalStrategy({
    usernameField: 'login',
    passwordField: 'login-password'
  }, function(login, password, done) {
    var UserModel = db.model('User');
    login = login.toLowerCase();
    UserModel.findOne({ 
      $or: [ { nickname_lc: login }, { email: login } ] 
    }, function processUser(err, userResult) {
      if (err) { 
        return done(err); 
      } else if (!userResult) {
        return done(null, false, {
          message: 'Unknown User'
        });
      }

      userResult.isValidPassword(password, function processPassword(err, passwordResult) {
        if (err) {
          done(err);
        } else if (!passwordResult) {
          done(null, false, {
            message: 'Invalid Password'
          });
        } else {
          done(null, userResult);
        }
      });
    });
  }));

  passport.serializeUser(function(user, done) {
    console.log('user', user)
    done(null, user._id);
  });

  passport.deserializeUser(function(userId, done) {
    var UserModel = db.model('User');
    UserModel.findById(userId, function(err, userResult) {
      done(err, userResult);
    });
  });

  db.model('User', User);
};