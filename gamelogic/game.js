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
    const BRICKTYPE = Object.freeze({ "FOREST": {x:1,y:3},
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

    var glDefaultPaddleWidth = 200;
    var glDefaultPaddleHeight = 20;
    var glDefaultBallRadius = 20;

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
        if (this.pause === undefined) {
            throw new TypeError("Must override method pause() in Class");
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

    pause(p) {

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

    pause(p) {

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

    angle() {
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

    pause(p) {

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

    pause(p) {

    }
}

//Helperfunctionen #####################################################################################
    //Image & sprite loading 

    //Music Loading, pause, restart

//Collision ############################################################################################
    //Check Collision general

    //resolve Collision Ball & Ball

    //resolve Collision Ball& Brick

    //resolve Collision Ball & Paddle

    //resolve Collision Ball & Wall

    //resolve Collision Paddle & Powerup

    function resolveCollisionPaddlePowerup(paddle,powerup){
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

    //resolve Collision Paddle & Wall

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
        glElements.push(new Brick(50,50,40,20,3,1));

        //Create Mainpaddle
        mainpaddle = new Paddle(glCenterX, percentageGlHeight(90), glDefaultPaddleWidth, glDefaultPaddleHeight, "#33BB97" );
        console.log(mainpaddle);
        glElements.push(mainpaddle);

        //Create Startball with zero velocity
        
        //Create Bricks
      
        //Create PowerUp

        glElements.push(new Powerup(glCenterX,140,1,12,1,POWERUPTYPE.LIFELOST));
        
        //Level related
            //Load Background
    
            //Load BackgroundAnimation
    
            //Load BackgroundMusic

            //Create Enemys

    }


    
    //MAIN-Gameloop
    
    function animate() {
        requestAnimationFrame(animate);
        
        //Clear Canvas
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        //act depending on gameState
        if(glGamestate !== GAMESTATE.PAUSE){

            //setPaddlelocation (here and not onResize() because of Collision checking)
            if(glMouse.x !== "undefined" && mainpaddle.getCenterX() !== glMouse.x){
                if(glMouse.x > glX && glMouse.x <= mainpaddle.getCenterX()){
                    mainpaddle.x = glX;
                }else if(glMouse.x < glWidth && glMouse.x >= (glWidth - mainpaddle.width)){
                    mainpaddle.x = glWidth - mainpaddle.width;
                }else{
                    mainpaddle.x = glMouse.x;
                }
            }
            
            
            //Resolve Collision
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