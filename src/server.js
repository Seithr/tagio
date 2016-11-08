const http = require('http');
const path = require('path');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// filenames to load into memory
const fileNames = ['/index.html', '/background_v1.png'];
// object to store files in mem by key
const cachedFiles = {};

// load each client file into memory
for (let i = 0; i < fileNames.length; i += 1) {
  const currentName = fileNames[i]; // current file name

  const resolvedPath = path.resolve(`${__dirname}/../client/${fileNames[i]}`);
  cachedFiles[currentName] = fs.readFileSync(resolvedPath);
}

const onRequest = (request, response) => {
  // Check if requested filename is in fileNames, If so, send it back.
  if (fileNames.indexOf(request.url) > -1) {
    response.writeHead(200); // 200 status okay
    response.end(cachedFiles[request.url]); // return the requested file
  } else {
    response.writeHead(200); // 200 status okay
    response.end(cachedFiles['/index.html']);
  }
};

// listen on specified port
const app = http.createServer(onRequest).listen(port);
console.log(`Listening on 127.0.0.1: ${port}`);

// pass the http server into socketio and get the websocket server as io
const io = socketio(app);

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
      console.dir(data);
      console.dir(users);

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
