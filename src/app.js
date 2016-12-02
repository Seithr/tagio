// import libraries
const path = require('path');
const http = require('http');
const express = require('express');
const compression = require('compression');
// const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
// const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const csrf = require('csurf');
const socketio = require('socket.io');

/* const dbURL = process.env.MONGODB_URI ||
  '' ||
  'mongodb://localhost/FoxMaker';

// attempt connect to database
mongoose.connect(dbURL, (err) => {
  if (err) {
    console.log('Could not connect to database');
    throw err;
  }
}); */

// pull in routes
const router = require('./router.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const app = express();
app.use('/assets', express.static(path.resolve(`${__dirname}/../client/`)));
app.use(compression());
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(session({
  secret: 'Kitsune',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
  },
}));
app.engine('handlebars', expressHandlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/../views`);
app.disable('x-powered-by');
app.use(csrf());
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }
  return false;
});

const server = http.createServer(app);

router(app);

server.listen(port, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Listening on port ${port}`);
});

// pass the http server into socketio and get the websocket server as io
const io = socketio(server);

// holds the list of users
const users = {};

// when a player makes a move
const onMove = (sock) => {
  const socket = sock;

  // just take data in and send it to everyone
  socket.on('move', (data) => {
    console.log('someone moved');

    // change only if the move is new
    if (users[data.name].moveTime < data.moveTime) {
      users[data.name].x = data.x;
      users[data.name].y = data.y;
      // console.dir(data);
      // console.dir(users);

      io.sockets.in('room1').emit('otherMove', users);
    }
  });
};

// when a player joins
const onJoin = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    console.log('new player joined');
    users[data.name] = data;

    socket.join('room1');
    io.sockets.in('room1').emit('newPlayer', users);
  });
};

// when a user disconnects/leaves
const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', (data) => {
    console.dir(data);
    // remove the user from the room
    socket.leave('room1');
  });
};

// set up all event listeners
io.sockets.on('connection', (socket) => {
  console.log('started');
  onDisconnect(socket);
  onMove(socket);
  onJoin(socket);
});

console.log('Websocket server started');
