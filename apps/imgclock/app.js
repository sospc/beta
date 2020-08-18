/*
Draws a fullscreen image from flash memory
Saves a small image to flash which is just the area where the clock is
Keeps an offscreen buffer and draws the time to that
*/
var is12Hour = (require("Storage").readJSON("setting.json",1)||{})["12hour"];
var inf = require("Storage").readJSON("imgclock.face.json");
var img = require("Storage").read("imgclock.face.img");
var IX = inf.x, IY = inf.y, IBPP = inf.bpp;
var IW = 174, IH = 45, OY = 24;
var bgwidth = img.charCodeAt(0);
var bgoptions;
if (bgwidth<240)
  bgoptions = { scale : 240/bgwidth };

require("Font7x11Numeric7Seg").add(Graphics);
var cg = Graphics.createArrayBuffer(IW,IH,IBPP,{msb:true});
var cgimg = {width:IW,height:IH,bpp:IBPP,buffer:cg.buffer};
var locale = require("locale");

// store clock background image in bgimg (a file in flash memory)
var bgimg = require("Storage").read("imgclock.face.bg");
// if it doesn't exist, make it
function createBgImg() {
  cg.drawImage(img,-IX,-IY,bgoptions);
  require("Storage").write("imgclock.face.bg", cg.buffer);
  bgimg = require("Storage").read("imgclock.face.bg");
}
if (!bgimg || !bgimg.length) createBgImg();

// Replays
var pressTimeout;
var lastKeyPress = 0;
function btnPressed() {
if (NRF.getSecurityStatus().connected) {
Bangle.buzz();
E.showMessage("You did a Replay\nSaving...\n","INFO");
setTimeout(()=>g.drawImage(img, 0,OY,bgoptions), 2000);
var time = getTime();
var timeSince = time - lastKeyPress;
lastKeyPress = time;
if (timeSince < 10) return; // ignore if < 10 sec ago 
if (pressTimeout) return; // ignore a second press within the 10 sec
// wait 5 seconds
pressTimeout = setTimeout(function() {
pressTimeout = undefined;
NRF.sendHIDReport([0,0,30,0,0,0,0,0], function() {
setTimeout(function() {
NRF.sendHIDReport([0,0,0,0,0,0,0,0]); 
}, 100);
});
}, 5000);
// wait 7 seconds for replay
pressTimeout = setTimeout(function() {
pressTimeout = undefined;
NRF.sendHIDReport([0,0,31,0,0,0,0,0], function() {
setTimeout(function() {
NRF.sendHIDReport([0,0,0,0,0,0,0,0]); 
}, 100);
});
}, 7000);}
else { E.showMessage("uReplay Watch \nis Offline...\n/nPress Replay Button\n to Check Again","WARNING!");
}}
// trigger btnPressed whenever the button is pressed
setWatch(btnPressed, BTN, {edge:"falling",repeat:true,debounce:50});
setWatch(function(e){
var isLong = (e.time-e.lastTime)>2;
if (isLong) Bangle.showLauncher();
}, BTN2, {repeat: false, edge: 'falling'}); 
setWatch(function(e){
var isLong = (e.time-e.lastTime)<2;
if (isLong) load("banglerun.app.js");
}, BTN3, {repeat: true, edge: 'falling'});

// draw background
g.drawImage(img, 0,OY,bgoptions);
// draw clock itself and do it every second
//draw();
//var secondInterval = setInterval(draw,1000);
// load widgets
Bangle.loadWidgets();
Bangle.drawWidgets();
// Stop when LCD goes off
Bangle.on('lcdPower',on=>{
  if (secondInterval) clearInterval(secondInterval);
  secondInterval = undefined;
  if (on) {
    g.drawImage(img, 0,OY,bgoptions);
    //secondInterval = setInterval(draw,1000);
    //draw();
  }
});
/*
// Show launcher when middle button pressed
setWatch(Bangle.showLauncher, BTN2, { repeat: false, edge: "falling" });*/
