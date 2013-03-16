
var helpers    = require('../helpers');

function indexRoute(req, res, next) {
  helpers.pjaxTitle('Index', req, res);
  res.render('index', { title: 'Index' });
}

exports.boot = function(app, db) {
  app.get('/', helpers.redirectUser('/browse'), indexRoute);
};