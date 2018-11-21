var canvas = document.getElementById('gameCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");

var img = new Image();
img.src="assets/bird.png";

img.onload = function(){
    ctx.drawImage(img, 50, 50, 128,128);
}
