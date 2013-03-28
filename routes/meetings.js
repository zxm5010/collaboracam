var helpers = require('../helpers');
var spawn   = require('child_process').spawn;
var io      = require('socket.io');
var fs      = require('fs');

function processAudio(app, db, socket) {
  return function(err, stdout, stderr) {
    if (err) { console.error(err); }
    console.log(stdout);
    console.log(stderr);
  }
}

function socket(app, db) {
  var Meeting = db.model('Meeting'); 
  var sock    = io.listen(app.server);

  sock.set('authorization', function(handshakeData, callback) {
    var meetingId  = handshakeData.query.meeting;
    var connection = handshakeData.query.connection;
    console.log(handshakeData);
    var connectionString = 'rtsp://';
    if (!meetingId || !connection) {
      return callback(null, false);
    }
    connectionString += connection;

    Meeting.findById(meetingId, function(err, meeting) {
      if (err) { return callback(err); }
      if (!meeting) { return callback(null, false); }
      handshakeData.meeting    = meeting;
      handshakeData.connection = connectionString;

      callback(null, true);
    });
  });

  sock.sockets.on('connection', function(socket) {
    var meeting  = socket.handshake.meeting;
    var connStr  = socket.handshake.connection;
    var audioDir = app.config['audio_dir'];
    var out      = fs.openSync(audioDir + '/' + meeting._id + '.m4a', 'w');
    socket.join(meeting._id);
    console.log(process.cwd());
    // Spawn child processes
    var audioProcess = spawn(
      './bin/openRTSP',
      ['-a', connStr], 
      { stdio: ['ignore', out, 'ignore'] }
    );

    socket.on('kill', function(data) {
      spawn('kill', ['-HUP', audioProcess.pid]);
    });
  });
}

exports.boot = function(app, db) {
  socket(app, db);
}