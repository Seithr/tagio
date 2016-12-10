"use strict";
  
let socket; //socket
let hCanvas, hctx, canvas, ctx, img;//canvas vars
let users = {};//holds users
let keyDown = [];//keep track of what keys are down
let keyPrev = 0;//last key released
let enterTime = new Date().getTime();//time opened
let itCTime = 0;//time since last forced it change

//CONSTANTS
const name = new Date().getTime();//user id number
const r = 15; //all players are the same size

//valid keystrokes
const KEYBOARD = {
  'KEY_A':'KeyA',
  'KEY_S':'KeyS',
  'KEY_W':'KeyW',
  'KEY_D':'KeyD'
};

//draws the field and all players
const draw = () => {
  //get the size of the user's window
  let width = document.body.clientWidth;
  let height = window.innerHeight - 23;
  
  //clear both canvases
  hctx.clearRect(0, 0, hCanvas.width, hCanvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  //set the size of the visible canvas
  canvas.width = width;
  canvas.height = height
  
  //draw background
  hctx.fillStyle = '#0000FF';
  hctx.fillRect(0,0,hCanvas.width,hCanvas.height);
  hctx.drawImage(img,0,0);
  
  //draws players
  hctx.fillStyle = '#FF0000';
  const key = Object.keys(users);
  for (let i = 0; i < key.length; i += 1) {
    if(users[key[i]].it === true) { hctx.fillStyle = "red" }
    else { hctx.fillStyle = users[key[i]].color; }
    hctx.beginPath();
    hctx.arc(users[key[i]].x,users[key[i]].y,r,0,2*Math.PI);
    hctx.fill();
  }
  
  //get player position
  let x = users[name].x;
  let y = users[name].y;
  
  //get position for clipping
  let cameraX = x - 150;
  let cameraY = y - 115;
  
  //draw the hidden canvas on the visible canvas scaled to correct size
  ctx.drawImage(hCanvas,cameraX,cameraY,300,230,0,0,width,height);
  
  //check for tagged
  tagCheck();
  
  //draws instructions as long as no more than 20 seconds have passed
  let cTime = new Date().getTime();
  if((cTime - enterTime) < 20000) {
    ctx.fillStyle = "#000000";
    ctx.font = "30px Verdana";
    ctx.fillText("Use WASD to move.",100,100);
  }
  
  //tells the player they are it (lasts 3 seconds)
  if(users[name].it == true){
    console.log('ur it');
    if((cTime - users[name].timeTagged) < 3000) {
      ctx.fillStyle = "red";
      ctx.font = "100px Verdana";
      ctx.fillText("Tag! You're IT!",200,200);
    }
  }
  
  //informs players the seeker has quit
  if(cTime - itCTime < 10000){
    ctx.fillStyle = "red";
    ctx.font = "50px Verdana";
    ctx.fillText("The previous It player has left. New It player has been chosen.",100,100);
  }
};//ends: draw

//checks if player has been tagged
const tagCheck = () => {
  let cTime = new Date().getTime();
  const key = Object.keys(users);
  for (let i = 0; i < key.length; i += 1) {
    //collisions only matter if other person is it
    if(users[key[i]].it === true && users[key[i]].name != name) {
      //if player is colliding with seeker and seeker can tag
      console.dir(users[key[i]]);
      console.dir(users[name]);
      console.log(collides(users[name],users[key[i]]));
      if(collides(users[name],users[key[i]]) === true){
        if(cTime - users[key[i]].timeTagged > 3000) {
          socket.emit('tag',{ tag: name, untag: users[key[i]].name});
        }
      }
    }
  }
};//ends: tagCheck

//decides if two objects are colliding
const collides = (a,b) => {
  let dx = a.x - b.x;
  let dy = a.y - b.y;
  let distance = Math.sqrt(dx*dx + dy*dy);
  
  return (distance < (r*2));
};//ends: collides

//player movement
const move = () => {
  //the time of the movement
  let time = new Date().getTime();
  //temp pos
  let x = users[name].x;
  let y = users[name].y;
  
  //Keyboard controls
  if(keyDown[KEYBOARD.KEY_A]){
    x -= users[name].speed;
    console.log('x: '+x);
  }
  if(keyDown[KEYBOARD.KEY_D]){
    x += users[name].speed;
  }
  if(keyDown[KEYBOARD.KEY_W]){
    y -= users[name].speed;
  }
  if(keyDown[KEYBOARD.KEY_S]){
    y += users[name].speed;
  }
  
  //check distance from center of map (at 500,500)
  let dx = x - 500;
  let dy = y - 500;
  let dFromCenter = Math.sqrt(dx*dx + dy*dy);
  //movement only updates if the player will be within the map
  if(dFromCenter < (395 - r)){
    //once tagged a player cannot move for 3 seconds
    if((time - users[name].timeTagged) > 3000) {
      users[name].x = x;
      users[name].y = y
      
      //console.dir(users);
      socket.emit('move',{ name: name, x: x, y: y, moveTime: time});
    }
  }
}; //ends: move

//holds socket event listeners
const setupSocket = () => {
  //when a movement is received
  socket.on('otherMove', (data) => {
    console.log('movements received');
    users = data;
    //console.dir(data);
  });
  
  socket.on('newPlayer', (data) => {
    console.log('player received');
    users = data;
  });
  
  socket.on('itQuit', (data) => {
    console.log('forced it change');
    users = data;
    itCTime = new Date().getTime();
  });
};//ends: setupSocket

$(window).load(() => {
  let time = new Date().getTime();
  //connect the socket so it disconnects when page unloads
  socket = io.connect();
  //get and set canvas
    //hidden canvas
  hCanvas = document.querySelector("#hCanvas");
  hCanvas.width = 1000;
  hCanvas.height = 1000;
  hctx = hCanvas.getContext("2d");
  canvas = document.querySelector("#mainCanvas");
  ctx = canvas.getContext("2d");
  
  //load background image
  img = new Image();
  img.src = 'assets/img/background_v2.png';
  img.onload = function(){
    hctx.drawImage(img,0,0);
    console.log("image loaded");
  };
  
  //event listeners
  setupSocket();//socket events
  window.addEventListener('keypress',function(e){ //keypresses
    console.log('keydown');
    keyDown[e.code] = true;
    console.log(e.code);
    console.dir(keyDown);
    move();
  });
  window.addEventListener('keyup',function(e){ //keyreleasses
    keyDown[e.code] = false;
    keyPrev = e.code;
  });
  window.addEventListener('beforeunload',function(e){ //before page unloads
    socket.emit('leaving',{ name: name });
  });
  
  //get a random position and color
  let sx = 300.0 + Math.floor(Math.random() * ((700 - 300) + 1));
  let sy = 300.0 + Math.floor(Math.random() * ((700 - 300) + 1));
  let c = "hsl("+ 300 * Math.random() +",50%,50%)";
  
  //send my data to the server
  socket.emit('join', { name: name, x: sx, y: sy, color: c, moveTime: time, it: false, timeTagged: 0, speed: 0.5});
  
  //draw approx 60 times a second
  setInterval(draw,17);
}) //ends: onLoad