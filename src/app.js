// import libraries
const path = require('path');
const http = require('http');
const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
// const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const csrf = require('csurf');
const socketio = require('socket.io');

/* const dbURL = process.env.MONGODB_URI ||
  '' ||
  'mongodb://localhost/Tag';

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
app.engine('handlebars', expressHandlebars());
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/../views`);
app.use(favicon(`${__dirname}/../client/img/favicon.png`));
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
// total users are playing
let playCount = 0;
const nSpeed = 0.6; // normal player speed
const tagSpeed = 1; // it player's speed

// pick someone to be it
const setIt = () => {
  const time = new Date().getTime();
  // loop through players and reset tag values
  const key = Object.keys(users);
  for (let i = 0; i < key.length; i += 1) {
    users[key[i]].it = false;
    users[key[i]].timeTagged = 0;
    users[key[i]].speed = nSpeed;
  }

  // whichever player the system finds first is it
  users[key[0]].it = true;
  users[key[0]].timeTagged = time;
  users[key[0]].speed = tagSpeed;
};

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

const onTag = (sock) => {
  const socket = sock;

  // just take data in and send it to everyone
  socket.on('tag', (data) => {
    console.log('someone was tagged!');

    const time = new Date().getTime();
    // untag seeker
    users[data.untag].it = false;
    users[data.untag].timeTagged = 0;
    users[data.untag].speed = nSpeed;
    // tag the prey
    users[data.tag].it = true;
    users[data.tag].timeTagged = time;
    users[data.tag].speed = tagSpeed;
  });
};

// when a player joins
const onJoin = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    console.log('new player joined');
    playCount += 1;
    users[data.name] = data;

    // first person to join is it
    if (playCount === 1) {
      const time = new Date().getTime();
      users[data.name].it = true;
      users[data.name].timeTagged = time;
      users[data.name].speed = tagSpeed;
    }

    socket.join('room1');
    io.sockets.in('room1').emit('newPlayer', users);
  });
};

// remove player from list just before the page unloads
const onLeave = (sock) => {
  const socket = sock;

  socket.on('leaving', (data) => {
    console.log('leaving');
    playCount -= 1;
    // console.dir(data);
    // if the person who leaves is it and there are others playing
    if (users[data.name].it === true && playCount > 0) {
      delete users[data.name];
      setIt();
      io.sockets.in('room1').emit('itQuit', users);
    } else {
      delete users[data.name];
    }
    // console.dir(users);
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
  onTag(socket);
  onMove(socket);
  onJoin(socket);
  onLeave(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
