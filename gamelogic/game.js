//global variables #####################################################################################
    //canvas related
    var gameCanvas = document.getElementById('gameCanvas');
    var ctx = gameCanvas.getContext("2d");
    var glWidth = window.innerWidth
    var glHeight = window.innerHeight;

    gameCanvas.width = glWidth;
    gameCanvas.height = glHeight;

        //Canvas Layers
        var bgCanvas = document.getElementById('bgCanvas');
        var bgctx = bgCanvas.getContext("2d");
        var bgWidthFac = 1.2;
        var bgHeightFac = 1.05;
        function setBgCanvasSize(){
            bgCanvas.width = glWidth * bgWidthFac;
            bgCanvas.height = glHeight * bgHeightFac;
        }
        setBgCanvasSize();

        var sbgCanvas = document.getElementById('sbgCanvas');
        var sbgctx = sbgCanvas.getContext("2d");
        function setSbgCanvasSize(){
            sbgCanvas.width = glWidth + 10;
            sbgCanvas.height = glHeight + 10;
        }
        setSbgCanvasSize();


    //Gamestate
    const GAMESTATE = Object.freeze({ "INITIAL": 0, "RUNNING": 1, "PAUSE": 2, "GAMEOVER": 3, "VICTORY": 4 })
    var glGamestate;
    var glFrame;

        function setGamestatus(GAMESTATE){
            glGamestate = GAMESTATE;
        }
    
    //Level & Element related
    const ELEMENTTYPE = Object.freeze({ "BALL": 1, "PADDLE": 2, "BRICK": 3, "POWERUP": 4, "ENEMY": 5, "BOSS": 6, "BUTTON":7})
    var glElements = [];
    
    var glMouse = {
        x: undefined,
        y: undefined
    }
        //Level
        var glWorlds;
        var glCurrentWorld;
        var glCurrentLevel;
        var glPlayerLifes;
        var glScore;

        //GameRelated Bools
        
        var magmaballactivated = false;
        
        //POWERUPS
        const POWERUPTYPE = Object.freeze({ "FOOD": 0,
                                    "PADDLEINCREASER": 1,
                                    "PADDLEDECREASER": 2,
                                    "FASTERBALL": 3,
                                    "SLOWERBALL": 4,
                                    "LIFEINCREASER": 5,
                                    "LIFEDECREASER": 6,
                                    "ADDBALL": 7,
                                    "MAGMABALL": 8});

        const POWERUPTYPEBYNAME = new Map([ ["foodtransparent", POWERUPTYPE.FOOD],
                                            ["increasesize", POWERUPTYPE.PADDLEINCREASER],
                                            ["decreasesize", POWERUPTYPE.PADDLEDECREASER],
                                            ["increasespeed", POWERUPTYPE.FASTERBALL],
                                            ["decreasespeed", POWERUPTYPE.SLOWERBALL],
                                            ["increaselife", POWERUPTYPE.LIFEINCREASER],
                                            ["decreaselife", POWERUPTYPE.LIFEDECREASER],
                                            ["addball", POWERUPTYPE.ADDBALL],
                                            ["magmaball", POWERUPTYPE.MAGMABALL]]);


    //GameAssets bzw. Pfade
    const ASSETSPATH = "../assets/";
    const SOUNDPATH = ASSETSPATH +"audio/sounds/";
    const MUSICPATH = ASSETSPATH +"audio/music/";
    const IMAGESPATH = ASSETSPATH +"images/";
    const WORLDJSONPATH = "level/worlds.json"
    const WORLDBASEPATH = "level/world"
    
        //TODO Music
        var glBackgroundmusic = new Audio();
        var soundBallHitsPaddle = new Audio();
        var soundLifeLost = new Audio();
        var soundHitWall = new Audio();
        var soundBrickCracks = new Audio();
        var soundPowerupReceived = new Audio();
        var soundFoodReceived = new Audio();
        var soundExplosion = new Audio();
        var soundGameOver = new Audio();
        var soundVictory = new Audio();

        //Images
        var glBolImagesLoaded;
        var imgCostelloBall;
        var imgHeart;
        var imgCrown;
        var imgFireworks;
        var imgPauseButton;
        var imgLevelBackground;
        var imgLevelStaticBackground;
        var imgFood;

    //Keycodes (https://keycode.info/)
    const KEYCODE = Object.freeze({ "ESC": 27, "P": 80, "SPACE": 32, "Enter": 13,
                                    "UP": 38, "W": 87,
                                    "LEFT": 37, "A":65,
                                    "DOWN": 40, "S": 83,
                                    "RIGHT": 39, "D": 68,
                                    "PLUS": 187, "MINUS": 189});

    //Default Variables and functions(TODO needs to change on resize)
    const DIRECTION = Object.freeze({   "NW":11.5,    "N":12,   "NO":1.5, 
                                        "W":9,                  "O":3, 
                                        "SW":7.5,     "S":6,    "SO":4.5})

                                        
    var glX, glY, glCenterX, glCenterY, 
        glDefault_PaddleWidth, glDefault_PaddleHeight, glDefault_PaddleX, glDefault_PaddleY, glDefault_PaddleDistractionMax,
        glDecimalPercentOfPaddleWhichReflects, glPaddleareaReflectColor,
        glDefault_BallDx, glDefault_BallDy, glDefault_BallRadius, glDefault_BallMass,
        glDefault_PlayerLifes, glPlayerMaxLifes,
        glDefault_PowerupFoodDy, glDefault_PowerupDy, glDefault_PowerupLifes, glDefault_PowerupPointsFood, glDefault_PowerupPointsNonFood, glPowerupProbability, glDefault_PowerupWidth, glDefault_PowerupHeight,
        glDefault_BrickColumnCount,glDefault_BrickRowCount, glDefault_BrickWidth, glDefault_BrickHeight, 
        glDefault_BrickSegementWidth, glDefault_BrickSegementStartX, glDefault_BrickSegementHeight, glDefault_BrickSegementStartY,
        glDefault_BrickLifes, glDefaultBrickMass,
        glDefault_imgSize, glDefault_HeightFraction,
        glDefault_ButtonWidth, glDefault_ButtonHeight, glDefault_PauseButtonX, glDefault_PauseButtonY;

    const glDefault_BallLifes = 1, glDefault_PaddleLifes = 1;;
    
    function percentageGlWidth(percent){
        return glWidth * (percent / 100);
    }

    function percentageGlHeight(percent){
        return glHeight * (percent / 100);
    }

    function recalculateDefaults(){
        glFrame = 0;
        glX = gameCanvas.x;
        glY = gameCanvas.y;
        glCenterX = glWidth / 2;
        glCenterY = glHeight/ 2;
        
        //In welchem Anteil des Canvas sollen Bricks erzeugt werden
        let heightAreaNumerator = 4;
        let heightAreaDenominator = 7;
        glDefault_HeightFraction = heightAreaNumerator/heightAreaDenominator;

        //Paddle & Ball
        glDefault_PaddleWidth = glWidth / 6.5;
        let suggestedPaddleHeight = 18;
        glDefault_PaddleHeight = (glHeight * (1-glDefault_HeightFraction)/6 > suggestedPaddleHeight) ? suggestedPaddleHeight: suggestedPaddleHeight * glDefault_HeightFraction;
        glDefault_PaddleX = glCenterX - (glDefault_PaddleWidth/2);
        glDefault_PaddleY= percentageGlHeight(90) - (glDefault_PaddleHeight/2);
        glDefault_PaddleDistractionMax = 2;
        glDecimalPercentOfPaddleWhichReflects = 0.3;
        glPaddleareaReflectColor = "#497F71";
        glDefault_BallDx = 0.00156 * glWidth; //0.00156 ; 0.00104
        glDefault_BallDx = (Math.random() >= 0.5) ? -glDefault_BallDx : glDefault_BallDx;
        glDefault_BallDy = 0.0068 * glHeight * - 1; //0.0068 ; 0.00454
        glDefault_BallMass = 1;
        glDefaul_minCostelloRadius = 8;
        glDefault_BallRadius = glDefault_PaddleWidth * 0.08;
        glDefault_imgSize = ((glDefault_PaddleWidth * 0.08) > (glDefaul_minCostelloRadius) ) ? glDefault_PaddleWidth * 0.08 * 2 : glDefaul_minCostelloRadius * 2;
        
        //PlayersLifes
        glDefault_PlayerLifes = 3;
        glPlayerMaxLifes = 6;

        //Text
        glDefault_fontSize = Math.floor(glHeight * 0.03);

        //Powerup
        glDefault_PowerupFoodDy = Math.abs(glDefault_BallDy * 0.5);
        glDefault_PowerupDy = Math.abs(glDefault_BallDy * 0.8);
        glDefault_PowerupLifes = 1;
        glDefault_PowerupPointsFood = 50;
        glDefault_PowerupPointsNonFood = 0;
        glPowerupProbability = 0.12;
        glDefault_PowerupWidth = 32;
        glDefault_PowerupHeight = 32;

        //Buttons
        glDefault_ButtonWidth = glWidth / 16;
        glDefault_ButtonHeight= glDefault_PaddleHeight;
        glDefault_PauseButtonX= glWidth - glDefault_ButtonWidth - 5;
        glDefault_PauseButtonY= glHeight - glDefault_ButtonHeight - 5;
    }

    function recalculateBrickDefaults(columns, rows){
        //BrickCreationDefaults
        glDefault_BrickColumnCount = columns;                                
        glDefault_BrickRowCount = rows;
        glDefault_BrickSegementWidth= glWidth / glDefault_BrickColumnCount;
        glDefault_BrickWidth = glDefault_BrickSegementWidth * 0.9;
        glDefault_BrickSegementStartX = glDefault_BrickSegementWidth * 0.05;
        glDefault_BrickSegementHeight = (glHeight/glDefault_BrickRowCount) * glDefault_HeightFraction;
        glDefault_BrickHeight = glDefault_BrickSegementHeight * 0.8;
        glDefault_BrickSegementStartY = glDefault_BrickSegementHeight * 0.1;
        glDefault_BrickLifes = 1; 
        glDefaultBrickMass = 1;
    }

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
        super(ELEMENTTYPE.PADDLE, x, y, glDefault_PaddleLifes, color);
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
        ctx.rect(this.x+(this.width*(1-glDecimalPercentOfPaddleWhichReflects))/2, this.y, this.width*glDecimalPercentOfPaddleWhichReflects,this.height);
        ctx.fillStyle = glPaddleareaReflectColor;
        ctx.fill();
        ctx.closePath();
    }
}

class Brick extends AbstractElement {
    constructor(columnId, rowId, x, y, width, height, lifes, mass, img, color) {
        super(ELEMENTTYPE.BRICK, x, y, lifes, color);
        this.columnId = columnId;
        this.rowId = rowId;
        this.width = width;
        this.height = height;
        this.mass = mass;
        this.img = img;
    }

    resolveBeingHit(){
        this.lifes -= 1;
        this.img = glWorlds[glCurrentWorld].getBrickImage(this.lifes);
        if(Math.random()<= glPowerupProbability && !magmaballactivated){
            createRandomPowerup(this.x + this.width/2 * 0.5, this.y + this.height/2 * 0.5);
        }
        if(this.lifes === 0){
            createFoodPowerup(this.x + this.width/2, this.y + this.height/2);
        }
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
        ctx.drawImage(this.img, this.x,this.y,this.width,this.height);
    }

    //Is not in use because of performance aspecst... even if it is kinda cool
    drawGradientRect(){
        let withDivider = 6;
        let heightDivider = 4;
        let rectPart = { width:(this.width / withDivider), height: (this.height / heightDivider)};

        for(var c = 0; c < this.width; c += rectPart.width){
            let percentwidth = c / this.width;
            for(var r = 0; r < this.height; r += rectPart.height){
                let percentheight = r / this.height;
                let percent = ((percentwidth + percentheight) / 2 ) * 1.5 -0.75;
                ctx.beginPath();
                ctx.rect(this.x + c, this.y + r, rectPart.width, rectPart.height);
                ctx.fillStyle = shadeColor2(this.color, percent);
                ctx.fill();
                ctx.closePath();
                ctx.drawImage(this.img, this.x,this.y,this.width,this.height);
            }
        }
    }
}

class Ball extends AbstractElement {
    constructor(x, y, dx, dy, radius, mass, color = "#c0701f") {
        super(ELEMENTTYPE.BALL, x, y, glDefault_BallLifes, color);
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

        if(this.radius > glDefaul_minCostelloRadius){
            this.drawCostello();
        }else{
            this.draw();
        }
    }

    drawCostello(){
        if(glGamestate !== GAMESTATE.INITIAL){
            rotateAndDrawImage(imgCostelloBall,this.x,this.y, this.radius,this.radius,this.angle() + Math.PI/2, this.radius * 2, this.radius * 2);   
        }else{
            ctx.drawImage(imgCostelloBall,this.x-this.radius,this.y-this.radius, this.radius * 2,this.radius * 2);
        }
    }

    draw() {
        //For a colored Ball
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.stroke();
        ctx.closePath();
    }
}

class Powerup extends AbstractElement {
    constructor(x, y, dy, radius, lifes, POWERUPTYPE, points, imgProperties = undefined) {
        super(ELEMENTTYPE.POWERUP, x, y, lifes);
        this.dy = dy;
        this.radius = radius;
        this.poweruptype = POWERUPTYPE;
        this.points = points;
        this.imgprop = imgProperties;
    }

    update() {
        if(glGamestate !== GAMESTATE.INITIAL && glGamestate != GAMESTATE.PAUSE){
            this.y += this.dy;
        }
        this.draw();
    }

    draw() {
        let destX = this.x - this.radius;
        let destY = this.y - this.radius;
        /*ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();*/
        let widthAndHeight = this.radius * 2;
        if(this.type !== POWERUPTYPE.FOOD){
            widthAndHeight *= 0.75;
        }
        ctx.drawImage(this.imgprop.sprite, this.imgprop.sourceX, this.imgprop.sourceY, this.imgprop.sourceWidth, this.imgprop.sourceHeight, destX, destY, widthAndHeight, widthAndHeight);
    }
}

class Button extends AbstractElement {
    constructor( x, y, width, height, color) {
        super(ELEMENTTYPE.BUTTON, x, y, 1, color);
        this.width = width;
        this.height = height;
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

class World{
    constructor(name, rank, levels, bgmusic, colors, brickImgNames, powerupImgNames){
        this.name = name;
        this.rank = rank;
        this.path = WORLDBASEPATH+this.rank+"_"+this.name +"/";
        this.levels = levels;
        this.bgmusic = bgmusic;
        this.colors = colors;
        this.brickImgNames = brickImgNames;
        this.brickImgFiles;
        this.powerupImgNames = powerupImgNames;
        this.powerupImgFiles;
        //TODO Boss, Music
    }

    setBrickImgFiles(arr){
        this.brickImgFiles = arr;
    }

    setPowerupImgFiles(arr){
        this.powerupImgFiles = arr;
    }

    countLevel(){
        return this.levels.length;
    }

    countColors(){
        return this.colors.length;
    }

    countBrickImages(){
        return this.brickImgNames.length;
    }

    countPowerupImages(){
        return this.powerupImgNames.length;
    }

    getLevelPath(level){
        level -= 1;
        return this.path + this.levels[level] + ".json";
    }

    getColor(index){
        index -= 1;
        return this.colors[index];
    }

    getBrickImage(index){
        index -= 1;
        return this.brickImgFiles[index];
    }

    getPowerupImageName(index){
        index -= 1;
        return this.powerupImgNames[index];
    }

    getPowerupImage(index){
        index -= 1;
        return this.powerupImgFiles[index];
    }
}

//Helperfunctions Design #################################################################################

    //Images
        //RotateImage Angle in Degrees
        function rotateAndDrawImage(image, xCanvas, yCanvas, xImage, yImage, angle, dw = undefined, dh = undefined){
            ctx.setTransform(1, 0, 0, 1, xCanvas, yCanvas);
            ctx.rotate(angle);
            if(dw !== undefined && dh !== undefined){
                ctx.drawImage(image, -xImage, -yImage, dw, dh); 
            }else{
                ctx.drawImage(image, -xImage, -yImage);
            }
            ctx.setTransform(1,0,0,1,0,0);
        }

        //Loading of Images
        function preloadImageAssets() {
            var _toPreload = 0;

            var addImage = function (src) {

                var img = new Image();
                img.src = IMAGESPATH + src;
                _toPreload++;

                img.addEventListener('load', function () {
                    _toPreload--;
                }, false);
                return img;
            }

            //Load DefaultImages
            imgCostelloBall = addImage("default/costelloball.png");
            imgHeart = addImage("default/heart.png");
            imgCrown = addImage("default/crown.png");
            imgFireworks = addImage("default/fireworks.png");
            imgPauseButton = addImage("default/pausebutton.png");
            imgFood = addImage("powerups/foodtransparent.png")
            
            //load Worlds images
                //Background    
                imgLevelBackground = addImage("backgrounds/bg_world"+glWorlds[glCurrentWorld].rank+"_"+glWorlds[glCurrentWorld].name+".png");
                imgLevelStaticBackground = addImage("backgrounds/sbg_world"+glWorlds[glCurrentWorld].rank+"_"+glWorlds[glCurrentWorld].name+".png");

                //Bricks
                let brickimages = [];
                glWorlds[glCurrentWorld].brickImgNames.forEach(function(brickImg){
                    brickimages.push(addImage("bricks/"+brickImg+".png"));
                });

                glWorlds[glCurrentWorld].setBrickImgFiles(brickimages);
            
                //Powerups
                let powerupimages = [];
                glWorlds[glCurrentWorld].powerupImgNames.forEach(function(powerupImg){
                    powerupimages.push(addImage("powerups/"+powerupImg+".png"));
                })

                glWorlds[glCurrentWorld].setPowerupImgFiles(powerupimages);

            var checkResources = function () {
                if (_toPreload == 0)
                    glBolImagesLoaded = true;
                else
                    setTimeout(checkResources, 200);
            }
            checkResources();
        }

        //TODO sprite next frame on framerate

    //Music Loading, pause, restart
        //load music
        function loadSounds(){
            soundBallHitsPaddle.src = SOUNDPATH + "bird.mp3";
            soundLifeLost.src = SOUNDPATH + "lifelost.mp3";
            soundHitWall.src = SOUNDPATH + "hit.mp3";
            soundBrickCracks.src = SOUNDPATH + "hit2.mp3";
            soundPowerupReceived.src = SOUNDPATH + "gotItem.mp3";
            soundFoodReceived.src = SOUNDPATH +"gained.mp3";
            soundExplosion.src = SOUNDPATH +"explosion.mp3";
            soundVictory.src = SOUNDPATH + "victory.mp3";
            soundGameOver.src = SOUNDPATH + "gameover.mp3";
        }

        function loadBackgroundMusic(){
            glBackgroundmusic.src = MUSICPATH + glWorlds[glCurrentWorld].bgmusic + ".mp3";
            glBackgroundmusic.volume = 0.5;
            glBackgroundmusic.loop = true;
        }

        function playBackgroundMusicDependingOnGameState(){
            if(glGamestate === GAMESTATE.PAUSE || glGamestate === GAMESTATE.VICTORY || glGamestate === GAMESTATE.GAMEOVER){
                glBackgroundmusic.pause();
            }else{
                let promise = glBackgroundmusic.play();
                if (promise !== undefined) {
                    promise.then(_ => {
                      // Autoplay started!
                    }).catch(error => {
                      console.log("User has to interact with the document to play Audio", error)
                    });
                  }

            }
        }

        function playSound(audio){
            audio.currentTime = 0;
            audio.play();
        }

    //Drawing
        //Lifes
        function drawPlayersLifes(){
            let difY = glHeight - glDefault_imgSize - 2;
            let difX = 2;

            for(var i = 0; i<glPlayerLifes; i++){
                ctx.drawImage(imgHeart,i*(difX+glDefault_imgSize)+2 ,difY, glDefault_imgSize, glDefault_imgSize);
            }
        }

        //Background
        function drawBackgroundOnBgCanvas() {
            //Difference on one side
            let difCanvasesWidth = (bgCanvas.width - glWidth)/2; 
            let difCanvasesHeight= (bgCanvas.height - glHeight)/2; 
            let startx = -difCanvasesWidth;
            let starty = -difCanvasesHeight;
            if(glGamestate === GAMESTATE.INITIAL){
                bgctx.drawImage(imgLevelBackground, startx, starty, bgCanvas.width, bgCanvas.height);
            }else{
                balls = glElements.filter(function(value, index, arr){
                    return value.type === ELEMENTTYPE.BALL;
                });
                
                if(balls[0] !== undefined){
                    let br = balls[0].radius;
                    let bx = balls[0].x;
                    let by = balls[0].y;
    
                    let distBallCenterX = glCenterX - bx;
                    let distBallCenterY = glCenterY - by;
    
                    let percentX = distBallCenterX / (glCenterX - br);
                    let percentY = distBallCenterY / (glCenterY - br);
    
                    let canvx = startx + (difCanvasesWidth * percentX);
                    let canvy = starty + (difCanvasesHeight * percentY);
                    bgctx.drawImage(imgLevelBackground, canvx, canvy, bgCanvas.width, bgCanvas.height);
                }else{
                    bgctx.drawImage(imgLevelBackground, startx, starty, bgCanvas.width, bgCanvas.height);
                }
            }
        }

        function drawStaticBackgroundOnSbgCanvas(){
            sbgctx.drawImage(imgLevelStaticBackground, 0, 0, sbgCanvas.width, sbgCanvas.height);
        }

        //Score
        function drawScore(){
            ctx.textAlign= "left";
            ctx.textBaseline = "top";
            drawText("Score "+glScore, 0, 0);
        }
        
        //Text related
        function drawText(text, x, y){
            let fontString = glDefault_fontSize + 'px "Press Start 2P"';
            ctx.font= fontString;
            ctx.fillStyle = "#F1F1F1";
            ctx.fillText(text, x , y);
            ctx.strokeStyle = "#000";
            ctx.strokeText(text, x , y);
        }

        function drawTextInCenter(text){
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            drawText(text, glCenterX , glCenterY);
        }

        function drawCurrentLevelOnScreen(){
            drawTextInCenter("Level " + glCurrentLevel);
        }

        //GameOver
        function drawGameOver(){
            drawTextInCenter("Game Over");
        }
        
        //Victory related
        function drawVictory(){
            drawTextInCenter("Level " + glCurrentLevel + " completed");
            drawCrown();
        }

        function drawCrown(){
            balls = glElements.filter(function(value, index, arr){
                return value.type === ELEMENTTYPE.BALL;
            });

            balls.forEach(function(ball){
                ball.dx = 0;
                ball.dy = -1;
                ball.drawCostello();
                ctx.drawImage(imgCrown, ball.x - ball.radius , ball.y - ball.radius*2, glDefault_imgSize,glDefault_imgSize);
            });
        }

        function drawFireworks(){
            let width = 514;
            let height = 720;
            let randomX = Math.random()*(glWidth-width);
            let randomY = Math.random()*(glHeight-height);
            ctx.drawImage(imgFireworks, randomX , randomY, width, height);
        }


        //helps to darken or to lighten a color
        function shadeColor2(color, percent) {
            var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
            return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
        }

    //Create Objects 
        function createWorldsViaObjects(jsonWorlds){
            var worlds = [];
            jsonWorlds.forEach(function(world){
                worlds.push(new World(world.name, world.rank, world.levels, world.bgmusic, world.colors, world.brickImgNames, world.powerupImgNames));
            })
            return worlds;
        }
    
        //Bricks
        function createBricksViaObjects(objects){
            var bricks = [];
            objects.forEach(function(object){
                bricks.push(new Brick(  object.columnId, object.rowId,
                                        object.columnId * glDefault_BrickSegementWidth + glDefault_BrickSegementStartX,
                                        object.rowId * glDefault_BrickSegementHeight + glDefault_BrickSegementStartY,
                                        glDefault_BrickWidth, glDefault_BrickHeight,
                                        object.lifes, object.mass, object.img, object.color));
            });
            return bricks;
        }

        function createBricksWholeField() {
            var bricks = [];
            for (var c = 0; c < glDefault_BrickColumnCount; c++) {
                for (var r = 0; r < glDefault_BrickRowCount; r++) {
                    bricks.push(new Brick(  c, r, 
                                            c * glDefault_BrickSegementWidth + glDefault_BrickSegementStartX,
                                            r * glDefault_BrickSegementHeight + glDefault_BrickSegementStartY,
                                            glDefault_BrickWidth, glDefault_BrickHeight,
                                            glDefault_BrickLifes, glDefaultBrickMass, "#33BB97"));
                }
            }
            return bricks;
        }

        //Powerups
        function createFoodPowerup(x,y){
            glElements.push(new Powerup(x, y, glDefault_PowerupFoodDy, glDefault_imgSize / 2, glDefault_PowerupLifes, POWERUPTYPE.FOOD, glDefault_PowerupPointsFood, getCoordinatesForARandomFood()));
        };

        function createRandomPowerup(x,y){
            let countPowerups = glWorlds[glCurrentWorld].countPowerupImages();

            //Which Type should be created?
            let whichone = Math.floor(Math.random()*countPowerups)+1;
            let type =  POWERUPTYPEBYNAME.get(glWorlds[glCurrentWorld].getPowerupImageName(whichone));

            //Select Image for this Type
            let img = glWorlds[glCurrentWorld].getPowerupImage(whichone);

            //Create Powerup
            glElements.push(new Powerup(x, y, glDefault_PowerupDy, glDefault_imgSize / 2, glDefault_PowerupLifes, type, glDefault_PowerupPointsNonFood, getCoordinatesForRandomPowerup(img)));
        };

        function getCoordinatesForARandomFood(){
            let sprite = imgFood;
            let divider = 10;
            let sourceX = 0;
            let sourceY = 0;
            let sourceWidth = 50;
            let sourceHeight = 50;

            let randomvalue1 = Math.floor(Math.random() * 10); 
            let randomvalue2 = Math.floor(Math.random() * 10);

            let facColumn = Math.floor(randomvalue1 % divider) ;
            let facRow = Math.floor(randomvalue2 % divider);

            sourceX = (facColumn * sourceWidth) + sourceX;
            sourceY = (facRow * sourceHeight) + sourceY;

            return getImageProperties(sprite, sourceX, sourceY, sourceWidth, sourceHeight)
        }

        function getCoordinatesForRandomPowerup(img){
            return getImageProperties(img, 0, 0, glDefault_PowerupWidth, glDefault_PowerupHeight);
        }

        function getImageProperties(sprite, sourceX, sourceY, sourceWidth, sourceHeight){
            return new Object({"sprite":sprite, "sourceX":sourceX, "sourceY":sourceY, "sourceWidth":sourceWidth, "sourceHeight":sourceHeight});
        }

        //Balls
        function createBallAbovePaddle(){
            if(mainpaddle !== undefined){
                return new Ball((mainpaddle.x + (mainpaddle.width/2)), (mainpaddle.y - mainpaddle.height - glDefault_BallRadius),
                                        glDefault_BallDx,glDefault_BallDy,glDefault_BallRadius,glDefault_BallMass);
                                        
            }
        }

//Collision ############################################################################################
    //Generals
        //distance
        function hypothenuse(cathetus1, cathetus2) {
            return Math.sqrt(cathetus1 ** 2 + cathetus2 ** 2);
        }

        function distancePoints(ax,ay,bx,by) {
            return hypothenuse((ax - bx),(ay - by));
        }

        function distanceBalls(a, b) {
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

        
        //Resets for Ball when collided to avoid dizzy behavior
        function resetBallToTop(ball, rect){
            ball.y = rect.y - ball.radius - 0.01;
        }
        
        function resetBallToLeft(ball, rect){
            ball.x = rect.x - ball.radius - 0.01;
        }
        
        function resetBallToRight(ball, rect){
            ball.x = rect.x + rect.width + ball.radius + 0.01;
        }
        
        function resetBallToBottom(ball, rect){
            ball.y = rect.y + rect.height + ball.radius + 0.01;
        }

    //Check Collision general
    function checkCollision(element, other){
        if(element.type === ELEMENTTYPE.BALL && other.type === ELEMENTTYPE.BALL && element !== other){
            if(distanceBalls(element, other) <= element.radius +other.radius){
                resolveCollision_BallBall(element,other);
                return;
            }
        }
        if(element.type === ELEMENTTYPE.BALL && other.type === ELEMENTTYPE.BRICK){
            let direction = checkCircleInRectangle(element,other)
            if(direction !== false){
                resolveCollision_BallBrick(element,other,direction);
                playSound(soundBrickCracks);
                return;
            }
        }
        if(element.type === ELEMENTTYPE.BALL && other.type === ELEMENTTYPE.PADDLE){
            let direction = checkCircleInRectangle(element,other)
            if(direction !== false){
                resolveCollision_BallPaddle(element,other,direction);
                playSound(soundBallHitsPaddle);
                return;
            }
        }
        if(element.type === ELEMENTTYPE.POWERUP && other.type === ELEMENTTYPE.PADDLE){
            let direction = checkCircleInRectangle(element,other)
            if(direction !== false){
                resolveCollision_PowerupPaddle(element,other);
                return;
            }
        }
    }

    function checkWallCollision(ball){
        let hitWall = false;
        let beyondBottom = false;
        if (ball.x - ball.radius + ball.dx < 0 ||
            ball.x + ball.radius + ball.dx > glWidth) {
            hitWall = true;
            //left and right
            ball.dx *= -1;
        }
        if (ball.y - ball.radius + ball.dy < 0) {
            hitWall = true;
            //top
            ball.dy *= -1;
        }
        if (ball.y - ball.radius > glHeight) {
            //bottom
            ball.lifes = 0;
            beyondBottom = true;
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
        if(hitWall){
            playSound(soundHitWall);
        }
        return beyondBottom;
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
        brick.resolveBeingHit();
        if(!magmaballactivated){
            switch(direction){
                case DIRECTION.N : ball.dy *= -1; resetBallToTop(ball, brick); break;
                case DIRECTION.S : ball.dy *= -1; resetBallToBottom(ball, brick); break;
                case DIRECTION.O : ball.dx *= -1; resetBallToRight(ball, brick); break;
                case DIRECTION.W : ball.dx *= -1; resetBallToLeft(ball, brick); break;
                case DIRECTION.NW: ball.dx = Math.abs(ball.dx)*-1 ; ball.dy = Math.abs(ball.dy)*-1; resetBallToLeft(ball, brick); resetBallToTop(ball, brick); break; 
                case DIRECTION.SW: ball.dx = Math.abs(ball.dx)*-1 ; ball.dy = Math.abs(ball.dy); resetBallToLeft(ball, brick); resetBallToBottom(ball, brick); break;
                case DIRECTION.SO: ball.dx = Math.abs(ball.dx); ball.dy = Math.abs(ball.dy); resetBallToRight(ball, brick); resetBallToBottom(ball, brick); break;
                case DIRECTION.NO: ball.dx = Math.abs(ball.dx); ball.dy = Math.abs(ball.dy)*-1; resetBallToRight(ball, brick); resetBallToTop(ball, brick); break;
                default: break;
            }
        }
    }

    //resolve Collision Ball & Paddle
    function resolveCollision_BallPaddle(ball, paddle, direction){
        let paddleCenterX = paddle.x + (paddle.width/2);
        let distBallxToPaddleCenter = Math.abs(paddleCenterX)-Math.abs(ball.x);
        let distractionPerDistance = glDefault_PaddleDistractionMax*(distBallxToPaddleCenter/((paddle.width/2)+(glDecimalPercentOfPaddleWhichReflects/2)));

        switch(direction){
            case DIRECTION.NW:  //Max distraction of the ball with direction to the left
                                resetBallToTop(ball, paddle); 
                                ball.dx = (Math.abs(glDefault_BallDx) + Math.abs(glDefault_PaddleDistractionMax))*-1 ;
                                ball.dy *= -1; break;
            case DIRECTION.N :  //CertainPercentage doesnt just reflect with default dx and acts like NW or NO with less distraction visual: [#####_reflective middle_######]
                                resetBallToTop(ball, paddle);
                                if(ball.x <= paddleCenterX - paddle.width * (glDecimalPercentOfPaddleWhichReflects/2)){
                                    ball.dx = Math.abs(distractionPerDistance)*-1 ;
                                }else if(ball.x > paddleCenterX + paddle.width * (glDecimalPercentOfPaddleWhichReflects/2)){
                                    ball.dx = Math.abs(distractionPerDistance);
                                }else{
                                    ball.dx = (ball.dx < 0)? Math.abs(glDefault_BallDx)*-1 :Math.abs(glDefault_BallDx);
                                }
                                ball.dy = -1 * Math.abs(glDefault_BallDy); break;
            case DIRECTION.NO:  //Max distraction of the ball with direction to the right
                                resetBallToTop(ball, paddle);
                                ball.dx = (Math.abs(glDefault_BallDx) + Math.abs(glDefault_PaddleDistractionMax));
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

    function resolveCollision_PowerupPaddle(powerup, paddle){
        powerup.lifes--;
        switch (powerup.poweruptype){
            case POWERUPTYPE.FOOD: handlePowerupFood(powerup); playSound(soundFoodReceived); playSound(soundFoodReceived); break;
            case POWERUPTYPE.PADDLEINCREASER: handlePowerupPaddleIncreaser(powerup); playSound(soundPowerupReceived); break;
            case POWERUPTYPE.PADDLEDECREASER: handlePowerupPaddleDecreaser(powerup) ; playSound(soundPowerupReceived); break;
            case POWERUPTYPE.FASTERBALL: handlePowerupFasterBall(powerup) ; playSound(soundPowerupReceived); break;
            case POWERUPTYPE.SLOWERBALL: handlePowerupSlowerBall(powerup) ; playSound(soundPowerupReceived); break;
            case POWERUPTYPE.LIFEINCREASER: handlePowerupLifeIncreaser(powerup); playSound(soundPowerupReceived); break;
            case POWERUPTYPE.LIFEDECREASER: handlePowerupLifeDecreaser(powerup); playSound(soundExplosion); break;
            case POWERUPTYPE.ADDBALL: handlePowerupAddBall(powerup); playSound(soundPowerupReceived); break;
            case POWERUPTYPE.MAGMABALL: handlePowerupMagmaBall(powerup); playSound(soundPowerupReceived); break;
        } 
    }

//PowerupHandling#######################################################################################
    function handlePowerupFood(powerup){
        glScore+= powerup.points;
    }

    function handlePowerupPaddleIncreaser(powerup){
        paddles = glElements.filter(function(value, index, arr){
            return value.type === ELEMENTTYPE.PADDLE;
        });

        paddles.forEach(function(paddle){
            paddle.width *= (paddle.width > glDefault_PaddleWidth * 2)? 1.05 : 1.25;
        })
    }

    function handlePowerupPaddleDecreaser(powerup){
        paddles = glElements.filter(function(value, index, arr){
            return value.type === ELEMENTTYPE.PADDLE;
        });

        paddles.forEach(function(paddle){
            paddle.width *= (paddle.width < glDefault_PaddleWidth/2)? 0.95 : 0.75;
        })
    }

    function handlePowerupFasterBall(powerup){
        balls = glElements.filter(function(value, index, arr){
            return value.type === ELEMENTTYPE.BALL;
        });

        balls.forEach(function(ball){
            ball.dy *= ( ball.dy > glDefault_BallDy*2.5) ? 1.1 : 1.6;
        })
    }

    function handlePowerupSlowerBall(powerup){
        balls = glElements.filter(function(value, index, arr){
            return value.type === ELEMENTTYPE.BALL;
        });

        balls.forEach(function(ball){
            ball.dy *= ( ball.dy < glDefault_BallDy/2) ? 0.9 : 0.6;
        })
    }

    function handlePowerupLifeIncreaser(powerup){
        if(glPlayerLifes < glPlayerMaxLifes){
            glPlayerLifes += 1;
        }
    }

    function handlePowerupLifeDecreaser(powerup){
        if(isGameOver()){
            handleGameOver();
        }
        glPlayerLifes -= 1;
    }

    function handlePowerupAddBall(powerup){
        setTimeout(function(){ glElements.push(createBallAbovePaddle());}, 750)
    }

    function handlePowerupMagmaBall(powerup){
        magmaballactivated = true;
        setTimeout(function(){ magmaballactivated = false;}, 3000);
    }

//PauseMenu related things #############################################################################
    function pause(){
        if(GAMESTATE !== GAMESTATE.INITIAL){
            if(glGamestate !== GAMESTATE.PAUSE){
                glGamestate = GAMESTATE.PAUSE;
            }else{
                glGamestate = GAMESTATE.RUNNING;
            }
        }
    }

//Eventlistener ########################################################################################
    //mousemove (für die Position der glMouse zu ändern)
    function onMousemove(event){
        if(glGamestate !== GAMESTATE.INITIAL){
            glMouse.x = event.clientX;
            glMouse.y = event.clientY;
        }
    }

    function onMouseDown(event){
        if(glGamestate !== GAMESTATE.VICTORY && glGamestate !== GAMESTATE.GAMEOVER){
            setGamestatus(GAMESTATE.RUNNING);
            checkButtons(event);
        }
    }

    function checkButtons(event){
        let buttons = glElements.filter(function(value, index, arr){
            return value.type === ELEMENTTYPE.BUTTON;
        });
        buttons.forEach(function(button){
            if(event.clientX < button.x + button.width && event.clientX > button.x &&
                event.clientY < button.y + button.height && event.clientY > button.y){
                    pause();
                    return;
                }
        });
    }

    //resize
    function onResize(event){
        glWidth = window.innerWidth;
        glHeight = window.innerHeight;

        //GameCanvas
        gameCanvas.width = glWidth;
        gameCanvas.height = glHeight;

        //Canvas Layers
        setBgCanvasSize();

        setSbgCanvasSize();

        initOnResizeOfLevel();
    }

    //keydown (Pausemenü, Effekte aktivieren, Throw Ball if Intitial)
    function onKeyDown(event){
        switch (event.keyCode) {
            case KEYCODE.P: pause(); break;
            case KEYCODE.ESC: handleEscape(); break;
            case KEYCODE.SPACE: setGamestatus(GAMESTATE.RUNNING); break;
            default: break;
        }
    }

    function handleEscape(){
        pause();
        let wannaquit = confirm("Do you want to leave the Level and return to the game menu?");
        if(wannaquit){
            window.open("../index.html", "_self");
        }else{
            pause();
        }
    }

//LevelBUilder #########################################################################################
    //JSONreader

        //loads a general json
        async function loadJson(src){
            let response = await fetch(src);
            let json = await response.json();
            return json;
        }

        //loads a level from json and creates it
        async function loadLevelFromJson(src) {
            let json = await loadJson(src);
            createBricksFromJSON(json);
        }
        
        //creates Bricks depending on given json
        async function createBricksFromJSON(json){
            let bricks;
            let positions = json.positions;
            //TODO hier muss eine neue recalculateDefaultsBricks() hin die infos aus positions.length und positions[0].length holt und in die default reihe und column speichert
            recalculateBrickDefaults(positions[0].length, positions.length);
            let prebricks = [];
            for(var r = 0; r < positions.length; r++){
                for(var c = 0; c < positions[0].length; c++){
                    let type = positions[r][c];
                    if(type > 0){
                        let maxlifes = glWorlds[glCurrentWorld].countBrickImages();
                        let lifes = (type % maxlifes === 0)? maxlifes : type % maxlifes; 
                        let color = (type % glWorlds[glCurrentWorld].countColors() === 0)? 
                                        glWorlds[glCurrentWorld].getColor(0) 
                                        : glWorlds[glCurrentWorld].getColor(type % glWorlds[glCurrentWorld].countColors());
                        let brickimg = glWorlds[glCurrentWorld].getBrickImage(lifes);
                        prebricks.push( new Object ({"rowId": r,"columnId":c, "lifes":lifes, "mass" : 1, "color": color, "img":brickimg }));
                    }
                }
            }
            bricks = createBricksViaObjects(prebricks);
            await bricks.forEach(function (brick) {
                glElements.push(brick);
            });
        }

        //Load Levels
        async function loadLevelFromUrl(){
            if(glWorlds === undefined){
                //define worlds
                let json = await loadJson(WORLDJSONPATH);
                glWorlds = createWorldsViaObjects(json.worlds);
                preloadImageAssets(glCurrentWorld);
            }else{
                preloadImageAssets(glCurrentLevel);
            }
            if(glBackgroundmusic.src === ""){
                loadBackgroundMusic();
            }
            document.title = glWorlds[glCurrentWorld].name + " " + glWorlds[glCurrentWorld].levels[glCurrentLevel-1];
            loadLevelFromJson(glWorlds[glCurrentWorld].getLevelPath(glCurrentLevel));
        }

        function loadNextLevel(){
            glCurrentLevel = parseInt(glCurrentLevel);
            if(glCurrentLevel + 1 > glWorlds[glCurrentWorld].countLevel()){
                glCurrentWorld = parseInt(glCurrentWorld)+1;
                glCurrentLevel = 0;
                loadBackgroundMusic();
            }
            glCurrentLevel = parseInt(glCurrentLevel)+1;
            loadLevelFromUrl();
        }

        function getUrlVariable(key){ 
            let query = window.location.search.substring(1); 
            let vars = query.split("&"); 
            for (let i=0;i<vars.length;i++){ 
                let pair = vars[i].split("="); 
                if (pair[0] == key){ 
                    return pair[1]; 
                } 
            }
            return undefined; 
        }

//GameHandler ##########################################################################################
    //initial
    function initGlElements(){
        setGamestatus(GAMESTATE.INITIAL);
        recalculateDefaults();
        recalculateBrickDefaults(glDefault_BrickColumnCount, glDefault_BrickRowCount);
        loadSounds();
        glElements = [];
            //Create Mainpaddle
            mainpaddle = new Paddle(glDefault_PaddleX, glDefault_PaddleY, glDefault_PaddleWidth, glDefault_PaddleHeight, "#33BB97" );
            glElements.push(mainpaddle);

            pausebutton = new Button(glDefault_PauseButtonX, glDefault_PauseButtonY, glDefault_ButtonWidth, glDefault_ButtonHeight, "#4289f4");
            glElements.push(pausebutton);
            
            //Create Startball
            glElements.push(createBallAbovePaddle());
    }

    function initScore(){
        glScore = 0;
    }

    function initOnStartOfGame() {
        initGlElements();
        initScore();
        glCurrentWorld = getUrlVariable("world");
        glCurrentLevel = getUrlVariable("level");
        glPlayerLifes = glDefault_PlayerLifes;
        loadLevelFromUrl();
    }

    function initOnStartOfLevel(){
        initGlElements();
        initScore();
        loadNextLevel();
    }
    
    //Init
    function initOnResizeOfLevel(){
        var oldbricks  = glElements.filter(function(value, index, arr){
            return value.type === ELEMENTTYPE.BRICK;
        });
        initGlElements();
        
        //Create Bricks
        bricks = createBricksViaObjects(oldbricks);
        bricks.forEach(function (brick) {
            glElements.push(brick);
        });
    }

    //Create a new Ball if there are no existing Balls and decrease the players life by one
    function initOnZeroBallsLevel(){
        //Change Gamestate
        setGamestatus(GAMESTATE.INITIAL);

        glPlayerLifes--;
        playSound(soundLifeLost);

        //Create Startball
        glElements.push(createBallAbovePaddle());

        //Remove Existing Powerups
        glElements = glElements.filter(function(value, index, arr){
            return value.type !== ELEMENTTYPE.POWERUP;
        });
    }

    //Handle Ball Off & GameOver
    function handleBallLoss(){
        if(!isGameOver()){
            let balls = glElements.filter(function(value, index, arr){
                return value.type === ELEMENTTYPE.BALL;
            });
            
            let newBallneeded = true;
            balls.forEach(function(ball){
                if(ball.lifes > 0){
                    newBallneeded = false;
                }
            })

            if(newBallneeded){
                initOnZeroBallsLevel();
            }
        }else{
            handleGameOver();
        }
    }

    function handlePowerupLoss(powerup){
        powerup.lifes--;
    }

    function isGameOver(){
        if(glPlayerLifes>1){
            return false;
        }
        return true;
    }

    function handleGameOver(){
        setGamestatus(GAMESTATE.GAMEOVER);
        playBackgroundMusicDependingOnGameState();
        playSound(soundGameOver);
        drawGameOver();
        setTimeout(function(){
            let restart = confirm("Restart");
            if(restart){ 
                initOnStartOfGame();
            }
        }, 3000);
    }

    function handleVictory(){
        setGamestatus(GAMESTATE.VICTORY);
        drawVictory()
        playBackgroundMusicDependingOnGameState();
        playSound(soundVictory);
        setTimeout(function(){
            drawFireworks();
        }, 500);
        setTimeout(function(){
            drawFireworks();
        }, 1500);
        setTimeout(function(){
            drawFireworks();
        }, 2500);
        setTimeout(function(){
            initOnStartOfLevel();
        }, 3000);
    }
    
    //MAIN-Gameloop
    function animate() {
        requestAnimationFrame(animate);
        
        if(glGamestate !== GAMESTATE.VICTORY && glGamestate !== GAMESTATE.GAMEOVER){
            //Clear Canvas
            ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
            bgctx.clearRect(bgCanvas.x,bgCanvas.y,bgCanvas.width,bgCanvas.height);
            sbgctx.clearRect(sbgCanvas.x,sbgCanvas.y,sbgCanvas.width,sbgCanvas.height);
            
            //Increase Frame
            glFrame += 1;
            
            //Pause /Initial Handling
            if(glGamestate !== GAMESTATE.PAUSE && glGamestate !== GAMESTATE.INITIAL){
                
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
                        if(checkWallCollision(element)){
                            handleBallLoss(element);
                        }
                    }
                    if(element.type === ELEMENTTYPE.POWERUP){
                        if(checkWallCollision(element)){
                            handlePowerupLoss(element);
                        }
                    }
                });
            }else{
            drawCurrentLevelOnScreen();
        }
        
        //Remove Elements {Brick, Ball, Powerup} with zero or less life
        var existingElements = glElements.filter(function(value, index, arr){
            return value.lifes > 0;
        });
        glElements = existingElements;
        
        //BackgroundMusic
        playBackgroundMusicDependingOnGameState();
        
        //Images and other drawing Drawing 
        if(glBolImagesLoaded){
            //Draw LevelSpecific Images
            drawBackgroundOnBgCanvas();
            drawStaticBackgroundOnSbgCanvas();
            
            //Draw lifes of the player
            drawPlayersLifes();
            
            //Update each Element
            glElements.forEach(function (element) {
                element.update()
            });
            
            //Draw Score
            drawScore();
        }else{
            ctx.beginPath();
            ctx.rect(0, 0, gameCanvas.width, gameCanvas.height);
            ctx.fillStyle = "#333";
            ctx.fill();
            ctx.closePath();
        }    
        
        //Check Victory
        let bricksAndPowerups = glElements.filter(function(value, index, arr){
            return value.type === ELEMENTTYPE.BRICK || value.type === ELEMENTTYPE.POWERUP;
        });
        if((bricksAndPowerups.length === 0 || bricksAndPowerups === undefined) && glGamestate !== GAMESTATE.INITIAL){
            handleVictory();
        }
    }
}
    
initOnStartOfGame();
animate();

//ADD Eventlisteners
window.addEventListener('mousemove', function(event){onMousemove(event)}, false);

window.addEventListener("mousedown", function(event){onMouseDown(event)},false);

window.addEventListener('resize', function(event){onResize(event)}, false);

window.addEventListener("keydown", function(event){onKeyDown(event)}, false);