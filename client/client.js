"use strict";
  
let socket; //socket
//canvas vars
let canvas;
let ctx;
let img;
//holds users
let users = {};
//keep track of what keys are down
let keyDown = [];
//last key released
let keyPrev = 0;
//time opened
let enterTime = new Date().getTime();

//CONSTANTS
const name = new Date().getTime();//user id number
const nSpeed = 0.5; //normal player speed
const tagSpeed = 1; //it player's speed <= not yet implemented
const r = 10; //all players are the same size

//valid keystrokes
const KEYBOARD = {
  'KEY_A':65,
  'KEY_S':83,
  'KEY_W':87,
  'KEY_D':68
};

//sets size of canvas equal to size of user's screen
const setCanvasSize = () => {
  let width = document.body.clientWidth;
  let height = window.innerHeight - 23;
  
  canvas.width = width;
  canvas.height = height;
};

//draws the field and all players
const draw = () => {
  //draw background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0000FF';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img,0,0);
  
  //draws players
  ctx.fillStyle = '#FF0000';

  for (let key in users) {
    if (users.hasOwnProperty(key)) {
      ctx.beginPath();
      ctx.arc(users[key].x,users[key].y,r,0,2*Math.PI);
      ctx.fill();
    }
  }
  
  //draws instructions as long as no more than 30 seconds have passed
  let cTime = new Date().getTime();
  if((cTime - enterTime) < 10000) {
    ctx.fillStyle = "#000000";
    ctx.font = "30px Verdana";
    ctx.fillText("Use WASD to move.",100,100);
  }
};

//decides if two objects are colliding
const collides = (a,b) => {
  let dx = a.x - b.y;
  let dy = a.y - b.y;
  let distance = Math.sqrt(dx*dx + dy*dy);
  
  return (distance < (a.radius + b.radius));
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
    x -= nSpeed;
  }
  if(keyDown[KEYBOARD.KEY_D]){
    x += nSpeed;
  }
  if(keyDown[KEYBOARD.KEY_W]){
    y -= nSpeed;
  }
  if(keyDown[KEYBOARD.KEY_S]){
    y += nSpeed;
  }
  
  //check distance from center of map
  let dx = x - 250;
  let dy = y - 250;
  let dFromCenter = Math.sqrt(dx*dx + dy*dy);
  //movement only updates if the player is within the map
  if(dFromCenter < (250 - r)){
    users[name].x = x;
    users[name].y = y
    
    //console.dir(users);
    socket.emit('move',{ name: name, x: users[name].x, y: users[name].y, moveTime: time});
  }
}; //ends: move

//holds socket event listeners
const setupSocket = () => {
  //when a movement is received
  socket.on('otherMove', (data) => {
    console.log('movements received');
    users = data;
    draw();
  });
  
  socket.on('newPlayer', (data) => {
    console.log('player received');
    users = data;
    draw();
  });
};//ends: setupSocket

$(window).load(() => {
  let time = new Date().getTime();
    socket = io.connect();//connect the socket
    //get and set canvas
      canvas = document.querySelector("#myCanvas");
      ctx = canvas.getContext("2d");
      setCanvasSize();
    
    //load background image
    img = new Image();
    img.src = '/img/background_v1.png';
    img.onload = function(){
      ctx.drawImage(img,0,0);
      console.log("image loaded");
    };
    
    //event listeners
    setupSocket();//socket events
    window.addEventListener('keypress',function(e){ //keypresses
      console.log('keydown');
      keyDown[e.keyCode] = true;
      move();
    });
    window.addEventListener('keyup',function(e){ //keyreleasses
      keyDown[e.keyCode] = false;
      keyPrev = e.keyCode;
    });
    
    //send my data to the server
    socket.emit('join', { name: name, x: 100.0, y: 100.0, moveTime: time });
})