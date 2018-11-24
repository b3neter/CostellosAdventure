//global variables #####################################################################################
    //canvas related
    var gameCanvas = document.getElementById('gameCanvas');
    var ctx = gameCanvas.getContext("2d");
    var glWidth = window.innerWidth
    var glHeight = window.innerHeight;

    gameCanvas.width = glWidth;
    gameCanvas.height = glHeight;

    //Gamestate
    const GAMESTATE = Object.freeze({ "INITIAL": 0, "RUNNING": 1, "PAUSE": 2, "GAMEOVER": 3, "VICTORY": 4 })
    var glGamestate;

        function setGamestatus(GAMESTATE){
            glGamestate = GAMESTATE;
        }
    
    //Level & Element related
    const ELEMENTTYPE = Object.freeze({ "BALL": 1, "PADDLE": 2, "BRICK": 3, "POWERUP": 4, "ENEMY": 5, "BOSS": 6})
    var glElements = [];
    var glMainpaddle;
    var glPlayerLifes = 3;
    
    var glMouse = {
        x: undefined,
        y: undefined
    }

        //Bricktypes
        const BRICKTYPE = Object.freeze({   "FOREST": {x:1,y:3},
                                            "SNOW": 2});

        //Bricktypes
        const POWERUPTYPE = Object.freeze({ "GROWINGPADDLE": 1,
                                    "SHRINKINGPADDLE": 2,
                                    "FASTERBALL": 3,
                                    "SLOWERBALL": 4,
                                    "LIFEGAINED": 5,
                                    "LIFELOST":6});

    //Images
    var glBolImagesLoaded = false;
    var imgBird = new Image();
    var imgHeart = new Image();

    //Keycodes (https://keycode.info/)
    const KEYCODE = Object.freeze({ "ESC": 27, "P": 80, "SPACE": 32, "Enter": 13,
                                    "UP": 38, "W": 87,
                                    "LEFT": 37, "A":65,
                                    "DOWN": 40, "S": 83,
                                    "RIGHT": 39, "D": 68,
                                    "PLUS": 187, "MINUS": 189});

    //useful Variables and functions(TODO needs to change on resize)
    const DIRECTION = Object.freeze({   "NW":11.5,    "N":12,   "NO":1.5, 
                                        "W":9,                  "O":3, 
                                        "SW":7.5,     "S":6,    "SO":4.5})

    var glX = gameCanvas.x;
    var glY = gameCanvas.y;
    var glCenterX = glWidth / 2;
    var glCenterY = glHeight/ 2;

    function percentageGlWidth(percent){
        return glWidth * (percent / 100);
    }

    function percentageGlHeight(percent){
        return glHeight * (percent / 100);
    }

    var glDefault_PaddleWidth = 200;
    var glDefault_PaddleHeight = 20;
    var glDefault_PaddleX = glCenterX - (glDefault_PaddleWidth/2);
    var glDefault_PaddleY= percentageGlHeight(90) - (glDefault_PaddleHeight/2);
    var glDefault_PaddleDistractionMax = 2;
    var glDefault_BallDx = 0.78 * 2;
    var glDefault_BallDy = 2.89 * 2;
    var glDefault_BallRadius = 15;

//Classes ##############################################################################################

class AbstractElement {
    constructor(ELEMENTTYPE, x, y, lifes = 1, color ="#000") {
        if (new.target === AbstractElement) {
            throw new TypeError("Cannot construct an Abstract instance directly");
        }
        if (this.update === undefined) {
            throw new TypeError("Must override method update() in Class");
        }
        if (this.draw === undefined) {
            throw new TypeError("Must override method draw() in Class");
        }
        this.type = ELEMENTTYPE;
        this.x = x;
        this.y = y;
        this.lifes = lifes;
        this.color = color;
    }
}

class Paddle extends AbstractElement {
    constructor(x, y, width, height, color) {
        let lifes = 1;
        super(ELEMENTTYPE.PADDLE, x - (width/2), y - (height/2), lifes, color);
        this.width = width;
        this.height = height;
    }

    update() {
        this.draw();
    }

    getCenterX(){
        return this.x + (this.width/2);
    }

    draw() {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(this.x+this.width/2,this.y);
        ctx.lineTo(this.x+this.width/2,this.y+this.height);
        ctx.strokeStyle="#FF0000";
        ctx.stroke();
        ctx.closePath();
    }
}

class Brick extends AbstractElement {
    constructor(x, y, width, height, lifes, mass, color = "#333") {
        super(ELEMENTTYPE.BRICK, x, y, lifes, color);
        this.width = width;
        this.height = height;
        this.mass = mass;
    }

    update() {
        this.draw();
    }

    draw() {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Ball extends AbstractElement {
    constructor(x, y, dx, dy, radius, lifes, mass, color ="orange") {
        super(ELEMENTTYPE.BALL, x, y, lifes, color);
        this.dx = dx;
        this.dy = dy;
        this.radius = radius;
        this.mass = mass;
    }

    angle(){
        //angle of ball with the x axis
        return Math.atan2(this.dy, this.dx);
    };

    velocity() {
        // magnitude of velocity vector
        return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    };

    update() {
        if(glGamestate !== GAMESTATE.INITIAL && glGamestate != GAMESTATE.PAUSE){
            this.x += this.dx;
            this.y += this.dy;
        }
        this.draw();
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Powerup extends AbstractElement {
    constructor(x, y, dy, radius, lifes, POWERUPTYPE) {
        super(ELEMENTTYPE.POWERUP, x, y, lifes);
     // no dx, always falling down
        this.dy = dy;
        this.radius = radius;
        this.effect = POWERUPTYPE;
    }

    update() {
        this.y += this.dy;
        this.draw();
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

//Helperfunctionen #####################################################################################

    //Image & sprite loading 
    function preloadImageAssets() {
        var _toPreload = 0;

        var addImage = function (src) {

            var img = new Image();
            img.src = src;
            _toPreload++;

            img.addEventListener('load', function () {
                _toPreload--;
            }, false);
            return img;
        }

        imgBird = addImage("../assets/bird.png");
        imgHeart = addImage("../assets/heart.png");
   
        
        var checkResources = function () {
            if (_toPreload == 0)
                glBolImagesLoaded = true;
            else
                setTimeout(checkResources, 200);
        }
        checkResources();
    }

    function drawPlayersLifes(){
        let imageSize = 32;
        let difY = glHeight - imageSize - 2;
        let difX = 2;

        for(var i = 0; i<glPlayerLifes; i++){
            ctx.drawImage(imgHeart,i*(difX+imageSize)+2 ,difY);
        }
    }

    //Music Loading, pause, restart

//Collision ############################################################################################
    //Generals
        //distance
        function hypothenuse(cathetus1, cathetus2) {
            return Math.sqrt(cathetus1 ** 2 + cathetus2 ** 2);
        }

        function distancePoints(a, b) {
            return hypothenuse((a.x + a.dx - b.x - b.dx),(a.y + a.dy - b.y - b.dy));
        }
        
        //Check collision between a circle-shaped object and a rectangular object 
        function checkCircleInRectangle(circle, rect){
            let rectCenterX = rect.x+(rect.width/2);
            let rectCenterY = rect.y+(rect.height/2);
            let distX = Math.abs(rectCenterX- circle.x);
            let distY = Math.abs(rectCenterY - circle.y);  

            /*
                         _______
                ( )     |       |       
                        |_______|       ( ) 

            */
            if(distX > (rect.width/2)+circle.radius){
                return false;
            }

            /*
                ( )
                 _______
                |       |       
                |_______| 

                    ( )
            */
            if(distY > (rect.height/2)+circle.radius){
                return false;
            }

            /*
                     _______
                  ( )       |       
                    |_______( ) 

            */
            if(distX <= (rect.width/2)+circle.radius && circle.y >= rect.y && circle.y <= rect.y + rect.height){
                //Hit Left
                if(circle.x < rectCenterX){
                    return DIRECTION.W;
                }
                //Hit Right
                if(circle.x > rectCenterX){
                    return DIRECTION.O;
                }
            }

            /*
                (_)_____
                |       |       
                |_______|
                    ( )
            */
            if(distY <= (rect.height/2)+circle.radius && circle.x >= rect.x && circle.x <= rect.x + rect.width){
                //Hit TOP
                if(circle.y < rectCenterY){
                    return DIRECTION.N;
                }
                //Hit BOTTOM
                if(circle.y > rectCenterY){
                    return DIRECTION.S;
                }
            }

            /*
              ( )_______( )
                |       |       
                |_______| 
              ( )       ( )
            */
            var dx=distX-rect.w/2;
            var dy=distY-rect.h/2;
            if(dx*dx+dy*dy<=(circle.r*circle.r)){
                if(circle.y < rectCenterY){
                    if(circle.x < rectCenterX){
                        //Hit CORNER TOP - LEFT
                        return DIRECTION.NW;
                    }else{
                        //Hit CORNER TOP - RIGHT
                        return DIRECTION.NO;
                    }
                }else{
                    if(circle.x < rectCenterX){
                        //Hit CORNER BOTTOM - LEFT
                        return DIRECTION.SW;
                    }else{
                        //Hit CORNER BOTTOM - RIGHT
                        return DIRECTION.SO;
                    }
                }
            }
        }

        
        //Resets for Ball when collided to avoid dizzy behavior
        function resetBallToTop(ball, rect){
            ball.y = rect.y - ball.radius;
        }
        
        function resetBallToLeft(ball, rect){
            ball.x = rect.x - ball.radius;
        }
        
        function resetBallToRight(ball, rect){
            ball.x = rect.x + rect.width + ball.radius;
        }
        
        function resetBallToBottom(ball, rect){
            ball.y = rect.y + rect.height + ball.radius;
        }

    //Check Collision general
    function checkCollision(element, other){
        if(element.type === ELEMENTTYPE.BALL && other.type === ELEMENTTYPE.BALL && element !== other){
            if(distancePoints(element, other) <= element.radius +other.radius){
                resolveCollision_BallBall(element,other);
            }
        }
        if(element.type === ELEMENTTYPE.BALL && other.type === ELEMENTTYPE.BRICK){
            let direction = checkCircleInRectangle(element,other)
            if(direction !== false){
                resolveCollision_BallBrick(element,other,direction);
            }
        }
        if(element.type === ELEMENTTYPE.BALL && other.type === ELEMENTTYPE.PADDLE){
            let direction = checkCircleInRectangle(element,other)
            if(direction !== false){
                resolveCollision_BallPaddle(element,other,direction);
            }
        }
    }

    function checkWallCollision(ball){
        if (ball.x - ball.radius + ball.dx < 0 ||
            ball.x + ball.radius + ball.dx > glWidth) {
            //left and right
            ball.dx *= -1;
        }
        if (ball.y - ball.radius + ball.dy < 0) {
            //top
            ball.dy *= -1;
        }
        if (ball.y - ball.radius > glHeight) {
            //bottom
            ball.lifes = 0;
            if(glPlayerLifes>1){
                glPlayerLifes--;
                init();
            }else{
                console.log("GAME OVER");
                let restart = confirm("Restart");
                if(restart){ init()};
                glPlayerLifes = 3;
            }
        }
        if (ball.y - ball.radius < 0) {
            //top set ballposition in canvas
            ball.y = ball.radius;
        }
        if (ball.x + ball.radius > glWidth) {
            //right set ballposition in canvas
            ball.x = ball.width - ball.radius;
        }
        if (ball.x - ball.radius < 0) {
            //left set ballposition in canvas
            ball.x = ball.radius;
        }
    }

    //resolve Collision Ball & Ball
    function resolveCollision_BallBall(ball, other){
        var theta1 = ball.angle();
        var theta2 = other.angle();
        var phi = Math.atan2(other.y - ball.y, other.x - ball.x);
        var m1 = ball.mass;
        var m2 = other.mass;
        var v1 = ball.velocity();
        var v2 = other.velocity();

        var dx1F = (v1 * Math.cos(theta1 - phi) * (m1 - m2) + 2 * m2 * v2 * Math.cos(theta2 - phi)) / (m1 + m2) * Math.cos(phi) + v1 * Math.sin(theta1 - phi) * Math.cos(phi + Math.PI / 2);
        var dy1F = (v1 * Math.cos(theta1 - phi) * (m1 - m2) + 2 * m2 * v2 * Math.cos(theta2 - phi)) / (m1 + m2) * Math.sin(phi) + v1 * Math.sin(theta1 - phi) * Math.sin(phi + Math.PI / 2);
        var dx2F = (v2 * Math.cos(theta2 - phi) * (m2 - m1) + 2 * m1 * v1 * Math.cos(theta1 - phi)) / (m1 + m2) * Math.cos(phi) + v2 * Math.sin(theta2 - phi) * Math.cos(phi + Math.PI / 2);
        var dy2F = (v2 * Math.cos(theta2 - phi) * (m2 - m1) + 2 * m1 * v1 * Math.cos(theta1 - phi)) / (m1 + m2) * Math.sin(phi) + v2 * Math.sin(theta2 - phi) * Math.sin(phi + Math.PI / 2);

        ball.dx = dx1F; 
        ball.dy = dy1F;
        other.dx = dx2F;
        other.dy = dy2F;
    }
    
    //resolve Collision Ball & Brick
    function resolveCollision_BallBrick(ball, brick, direction){
        console.log("resolve BRICK");
        brick.lifes--;
        console.log(direction);
        switch(direction){
            case DIRECTION.N : ball.dy *= -1; resetBallToTop(ball, brick); break;
            case DIRECTION.S : ball.dy *= -1; resetBallToBottom(ball, brick); break;
            case DIRECTION.O : ball.dx *= -1; resetBallToRight(ball, brick); break;
            case DIRECTION.W : ball.dx *= -1; resetBallToLeft(ball, brick); break;
            case DIRECTION.NO: ball.dx *= -1; ball.dy *= -1; resetBallToTop(ball, brick); break; 
            case DIRECTION.SO: ball.dx *= -1; ball.dy *= -1; resetBallToBottom(ball, brick); break;
            case DIRECTION.SW: ball.dx *= -1; ball.dy *= -1; resetBallToBottom(ball, brick); break;
            case DIRECTION.NW: ball.dx *= -1; ball.dy *= -1; resetBallToTop(ball, brick); break;
            default: break;
        }
    }

    //resolve Collision Ball & Paddle
    function resolveCollision_BallPaddle(ball, paddle, direction){
        console.log("resolve: "+direction);
        let percentOfPaddleWhichReflects = 30;
        let paddleCenterX = paddle.x + (paddle.width/2);
        let distBallxToPaddleCenter = Math.abs(paddleCenterX-ball.x);
        let simpleXDistraction = glDefault_PaddleDistractionMax*(distBallxToPaddleCenter/((paddle.width/2)+ball.radius));

        switch(direction){
            case DIRECTION.NW:  //Max distraction of the ball with direction to the left
                                resetBallToTop(ball, paddle); 
                                ball.dx = (glDefault_BallDx + glDefault_PaddleDistractionMax)*-1 ;
                                ball.dy *= -1; break;
            case DIRECTION.N :  //CertainPercentage doesnt just reflect with default dx and acts like NW or NO with less distraction visual: [#####_reflective middle_######]
                                resetBallToTop(ball, paddle);
                                if(ball.x <= paddleCenterX - paddle.width * (percentOfPaddleWhichReflects/200)){
                                    ball.dx= (glDefault_BallDx + simpleXDistraction)*-1 ;
                                }else if(ball.x > paddleCenterX + paddle.width * (percentOfPaddleWhichReflects/200)){
                                    ball.dx=(glDefault_BallDx + simpleXDistraction);
                                }else{
                                    ball.dx = (ball.dx < 0)? glDefault_BallDx*-1 :glDefault_BallDx;
                                }
                                ball.dy *= -1; break;
            case DIRECTION.NO:  //Max distraction of the ball with direction to the right
                                resetBallToTop(ball, paddle);
                                ball.dx = (glDefault_BallDx + glDefault_PaddleDistractionMax);
                                ball.dy *= -1; break; 
            case DIRECTION.O :  //Max distraction of the ball with direction to the right
                                resetBallToTop(ball, paddle);
                                resetBallToRight(ball, paddle);
                                ball.dx = (Math.abs(ball.dx) + glDefault_PaddleDistractionMax);
                                ball.dy *= -1; break;
            case DIRECTION.W :  //Max distraction of the ball with direction to the left
                                resetBallToTop(ball, paddle);
                                resetBallToLeft(ball, paddle);
                                ball.dx = (Math.abs(ball.dx) + glDefault_PaddleDistractionMax)*-1;
                                ball.dy *= -1; break;
            default: break;
        }
    }

    //resolve Collision Paddle & Powerup
    function resolveCollision_PaddlePowerup(paddle,powerup){
       if (powerup.y > paddle.y){
           switch (Powerup.effect){
               case POWERUPTYPE.FASTERBALL: console.log ("Schneller Ball"); break;
               case POWERUPTYPE.GROWINGPADDLE: console.log ("Groesseres Paddle"); break;
               case POWERUPTYPE.LIFEGAINED: console.log ("Groesseres Paddle"); break;
               case POWERUPTYPE.LIFELOST: console.log ("Leben verloren"); break;
               case POWERUPTYPE.SHRINKINGPADDLE: console.log ("Kleineres Paddle"); break;
               case POWERUPTYPE.SLOWERBALL: console.log ("Langsamer Ball"); break;
            }      
        }
    }

//PauseMenu related things #############################################################################
    function pause(){
        if(glGamestate !== GAMESTATE.PAUSE){
            glGamestate = GAMESTATE.PAUSE;
        }else{
            glGamestate = GAMESTATE.RUNNING;
        }
    }

//Eventlistener ########################################################################################
    //mousemove (für die Position der glMouse zu ändern)
    function onMousemove(event){
        glMouse.x = event.clientX;
        glMouse.y = event.clientY;
    }

    //resize
    function onResize(event){
        glWidth = window.innerWidth;
        glHeight = window.innerHeight;

        gameCanvas.width = glWidth;
        gameCanvas.height = glHeight;
        
        //TODO (Art der Sklaierung muss implementiert werden, vorerst neuer init())
        init();
    }

    //keydown (Pausemenü, Effekte aktivieren, Throw Ball if Intitial)
    function onKeyDown(event){
        switch (event.keyCode) {
            case KEYCODE.P: pause(); break;
            case KEYCODE.SPACE: setGamestatus(GAMESTATE.RUNNING);
            default: break;
        }
    }

//LevelBUilder #########################################################################################
    //JSONreader

    //Lebensanzeige

    //Score?

//GameHandler ##########################################################################################
    //initial
    function init() {
        glElements = [];
        preloadImageAssets();

        //Change Gamestate
        setGamestatus(GAMESTATE.INITIAL);

        //Create Mainpaddle
        mainpaddle = new Paddle(glDefault_PaddleX, glDefault_PaddleY, glDefault_PaddleWidth, glDefault_PaddleHeight, "#33BB97" );
        console.log(mainpaddle);
        glElements.push(mainpaddle);
        
        //Create Startball with zero velocity
        createBallAbovePaddle();

        //TODO Create Bricks
        bricks = createBricks();
        bricks.forEach(function (brickArr) {
            brickArr.forEach(function (brick) {
                glElements.push(brick);
            })
        });

        //Create PowerUp

        //Create PowerUp
            //glElements.push(new Powerup(glCenterX,140,1,12,1,POWERUPTYPE.LIFELOST));
        
        //Level related
            //Load Background
    
            //Load BackgroundAnimation
    
            //Load BackgroundMusic

            //Create Enemys

    }

    //TODO überarbeiten
    function createBricks() {
        let brickColumnCount = 12;
        let brickRowCount = 8;
        let winwidth = glWidth / brickColumnCount;
        let width = winwidth * 0.9;
        let xstart = winwidth * 0.05;
        let winheight = (glHeight * 4) / (7 * brickRowCount);
        let height = winheight * 0.8;
        let ystart = winheight * 0.1;
    
        var bricks = [];
        for (var c = 0; c < brickColumnCount; c++) {
            bricks[c] = [];
            for (var r = 0; r < brickRowCount; r++) {
                bricks[c][r] = new Brick(c * winwidth + xstart, r * winheight + ystart, width, height);
            }
        }
        return bricks;
    }

    function createBallAbovePaddle(){
        if(mainpaddle !== undefined){
            setGamestatus(GAMESTATE.INITIAL);

            glElements.push(new Ball(glDefault_PaddleX + (glDefault_PaddleWidth/2), (glDefault_PaddleY - glDefault_PaddleHeight - glDefault_BallRadius),
                                    glDefault_BallDx,glDefault_BallDy,glDefault_BallRadius,1,1));
        }
    }
    
        
    //MAIN-Gameloop
    
    function animate() {
        requestAnimationFrame(animate);
        
        //Clear Canvas
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        //act depending on gameState
        if(glGamestate !== GAMESTATE.PAUSE){

            //setPaddlelocation (here and not onResize() because of Collision checking)
            if(glMouse.x !== undefined && mainpaddle.getCenterX() !== glMouse.x){
                if(glMouse.x > glX && glMouse.x <= mainpaddle.getCenterX()){
                    mainpaddle.x = glX;
                }else if(glMouse.x < glWidth && glMouse.x >= (glWidth - mainpaddle.width)){
                    mainpaddle.x = glWidth - mainpaddle.width;
                }else{
                    mainpaddle.x = glMouse.x;
                }
            }else{
                mainpaddle.x = glDefault_PaddleX;
                mainpaddle.y = glDefault_PaddleY;
            }
            
            
            //Resolve Collision
            glElements.forEach(function (element){
                glElements.forEach(function (other){
                    checkCollision(element, other);
                })
                if(element.type === ELEMENTTYPE.BALL){
                    checkWallCollision(element);
                }
            });
        }
            
            //Remove Elements {Brick, Ball, Powerup} with zero or less life
            let victory = true;
            
            var test = glElements.filter(function(value, index, arr){
                return value.lifes > 0;
            });
            glElements = test;

            //Check Victory
            if(victory){

            }

            //Update each Element
            glElements.forEach(function (element) {
                element.update()
            });

            //Draw lifes of the player
            if(glBolImagesLoaded){
                drawPlayersLifes();
            }
    }
    
init();
animate();

//ADD Eventlisteners
window.addEventListener('mousemove', function(event){onMousemove(event)}, false);

window.addEventListener('resize', function(event){onResize(event)}, false);

window.addEventListener("keydown", function(event){onKeyDown(event)}, false);