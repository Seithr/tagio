const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read client html file into memory
const index = fs.readFileSync(`${__dirname}/../client/index.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

// listen on specified port
const app = http.createServer(onRequest).listen(port);
console.log(`Listening on 127.0.0.1: ${port}`);

// pass the http server into socketio and get the websocket server as io
const io = socketio(app);

// holds the list of users
const users = [];

// when a player makes a move
const onMove = (sock) => {
  const socket = sock;

  // just take data in and send it to everyone
  socket.on('click', (data) => {
    console.log('someone moved');

    io.sockets.in('room1').emit('otherMove', { });
  });
};

// when a player joins
const onJoin = (sock) => {
  const socket = sock;

  socket.on('newPlayer', (data) => {
    console.log('new player joined');
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
  socket.join('room1');
});

console.log('Websocket server started');
