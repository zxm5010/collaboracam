
exports.boot = function(db) {
  var Meeting = new db.Schema({
    name: String
  });

  var meet = db.model('Meeting', Meeting);

  var newMeet = new meet({
    name: 'Test'
  });

  newMeet.save();
}