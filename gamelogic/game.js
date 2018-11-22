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
    var effect = 1;
    
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



    //Keycodes (https://keycode.info/)
    const KEYCODE = Object.freeze({ "ESC": 27, "P": 80, "SPACE": 32, "Enter": 13,
                                    "UP": 38, "W": 87,
                                    "LEFT": 37, "A":65,
                                    "DOWN": 40, "S": 83,
                                    "RIGHT": 39, "D": 68,
                                    "PLUS": 187, "MINUS": 189});

    //useful Variables and functions(TODO needs to change on resize)
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
    var glDefault_BallDx = 0.78;
    var glDefault_BallDy = 2.89;
    var glDefault_BallRadius = 20;

//Classes ##############################################################################################

class AbstractElement {
    constructor(ELEMENTTYPE, x, y, color ="#000") {
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
        this.color = color;
    }
}

class Paddle extends AbstractElement {
    constructor(x, y, width, height, color) {
        super(ELEMENTTYPE.PADDLE, x - (width/2), y - (height/2), color);
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
    }
}

class Brick extends AbstractElement {
    constructor(x, y, width, height, lifes, mass) {
        super(ELEMENTTYPE.BRICK, x, y);
        this.width = width;
        this.height = height;
        this.mass = mass;
        this.lifes = lifes;
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
    constructor(x, y, dx, dy, radius, lifes, mass) {
        super(ELEMENTTYPE.BALL, x, y);
        this.dx = dx;
        this.dy = dy;
        this.radius = radius;
        this.mass = mass;
        this.lifes = lifes;
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
        super(ELEMENTTYPE.POWERUP, x, y);
     // no dx, always falling down
        this.dy = dy;
        this.radius = radius;
        this.lifes = lifes;
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

    //Music Loading, pause, restart

//Collision ############################################################################################
    //Generals
        //distance between two balls
        function distanceBall(a, b) {
            return Math.sqrt((a.x + a.dx - b.x - b.dx) ** 2 + (a.y + a.dy - b.y - b.dy) ** 2) - a.radius - b.radius;
        }

        function checkCircleInRectangle(circle, rect){
            //https://stackoverflow.com/questions/21089959/detecting-collision-of-rectangle-with-circle
            var distX = Math.abs(circle.x - rect.x-rect.width/2);
            var distY = Math.abs(circle.y - rect.y-rect.height/2);
            
            //don't collide if distance is more than the sum of rects x and 
            if (distX > (rect.width/2 + circle.radius)) { ;return false; }
            if (distY > (rect.height/2 + circle.radius)) { ;return false; }
            
            //Collide if distance between Centers are less the rects inner distance
            if (distX <= (rect.width/2)) { ;return true; } 
            if (distY <= (rect.height/2)) { ;return true; }
            
            //Collide on rect Corner
            var dx=distX-rect.width/2;
            var dy=distY-rect.height/2;
            return (dx*dx+dy*dy<=(circle.r*circle.r));
        }

    //Check Collision general
    function checkCollision(element, other){
        if(element.type === ELEMENTTYPE.BALL && other.type === ELEMENTTYPE.BALL && element !== other){
            resolveCollision_BallBall(element,other);
        }
        if(element.type === ELEMENTTYPE.BALL && other.type === ELEMENTTYPE.BRICK){
            if(checkCircleInRectangle(element,other)){
                resolveCollision_BallBrick(element,other);
            }
        }
        if(element.type === ELEMENTTYPE.BALL && other.type === ELEMENTTYPE.PADDLE){
            if(checkCircleInRectangle(element,other)){
                resolveCollision_BallPaddle(element,other);
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
        if (ball.y + ball.radius > glHeight) {
            //bottom
            ball.lives = 0;
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
    function resolveCollision_BallBrick(ball, brick){
        var distX = Math.abs(ball.x - brick.x-brick.width/2);
        var distY = Math.abs(ball.y - brick.y-brick.height/2);
        
        if (distX > (brick.width/2 + ball.radius)) { 
            brick.lifes--;
            ball.dx *= -1;
        }
        if (distY > (brick.height/2 + ball.radius)) {
            brick.lifes--;
            ball.dy *= -1;
        }
    }

    //resolve Collision Ball & Paddle
    function resolveCollision_BallPaddle(ball, paddle){
        //TODO
        var distX = Math.abs(ball.x - paddle.x-paddle.width/2);
        var distY = Math.abs(ball.y - paddle.y-paddle.height/2);
        
        if (distX > (paddle.width/2 + ball.radius)) { 
            ball.dx *= -1;
        }
        if (distY > (paddle.height/2 + ball.radius)) {
            ball.dy *= -1;
        }
    }

    //resolve Collision Paddle & Powerup
    function resolveCollision_PaddlePowerup(paddle,powerup){
       if (paddle.y === powerup.y){
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

        //Change Gamestate
        setGamestatus(GAMESTATE.RUNNING);

        //Create Mainpaddle
        mainpaddle = new Paddle(glDefault_PaddleX, glDefault_PaddleY, glDefault_PaddleWidth, glDefault_PaddleHeight, "#33BB97" );
        console.log(mainpaddle);
        glElements.push(mainpaddle);
        
        //Create Startball with zero velocity
        
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
            
            //Check Victory
            
            //Update each Element
            glElements.forEach(function (element) {
                element.update()
            });
    }
    
init();
animate();

//ADD Eventlisteners
window.addEventListener('mousemove', function(event){onMousemove(event)}, false);

window.addEventListener('resize', function(event){onResize(event)}, false);

window.addEventListener("keydown", function(event){onKeyDown(event)}, false);