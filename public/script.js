const socket = io();
let id = "";

const preview = document.getElementById("preview");
const game = document.getElementById("game");
const namePortal = document.getElementById("namePortal");
const nameInput = document.getElementById("nameInput");
const nameBoard = document.getElementById("nameBoard");
const nameList = document.getElementById("nameList");
const adminButton = document.getElementById("adminButton");
const startGameBtn = document.getElementById("startGameBtn");
const butterfliesLoaded = document.getElementById("butterfliesLoaded");
const timer = document.getElementById("timer");

const killScreen = document.getElementById("killScreen");

//admin
let admin = false;

let gameEnded = false;

//visibility
namePortal.style.visibility = "visible";
nameBoard.style.visibility = "hidden";
game.style.visibility = "hidden";
preview.style.visibility = "hidden";
adminButton.style.visibility = "hidden";
startGameBtn.style.visibility = "hidden";
killScreen.style.visibility = "hidden";
timer.style.visibility = "hidden";


function enterName(){
    if (nameInput.value) {
        socket.emit("new user", nameInput.value);
        nameInput.value = "";
    }
}
    
socket.on("sendToNameBoard", (myId) => {
    id = myId;
    namePortal.style.visibility = "hidden";
    nameBoard.style.visibility = "visible";
})
socket.on("updateNameBoard", (players) => {
    while (nameList.firstChild) {
        nameList.firstChild.remove()
    }
    for (const [key, value] of Object.entries(players)) {
        var newUser = document.createElement("p");
        var text = document.createTextNode(value);
        newUser.appendChild(text);
        nameList.appendChild(newUser);
    }
})

//designate admin
socket.on("adminOn", () => {
    admin = true;
    adminButton.style.visibility = "visible";
    startGameBtn.style.visibility = "visible";
    butterfliesLoaded.style.visibility = "visible";
})
function pingLoaded(){socket.emit("pingLoaded");}
socket.on("butterflies loaded", (numLoaded) => {
    butterfliesLoaded.innerHTML = "total loaded templates: " + numLoaded;
})


function startGame(){
    socket.emit("startGame");
}

//poisonous preview
const pcanvas = document.getElementById("poisonCanvas");
const pctx = pcanvas.getContext("2d");

//drawing screen

const timeLeft = document.getElementById("timeLeft");

const dcanvas = document.getElementById("drawCanvas");
const ctx = dcanvas.getContext("2d");
const displayTool = document.getElementById("dispTool");
const displayColor = document.getElementById("dispColor");
const colorBox = document.getElementById("colorBox");


// variables

const killScreenTimer = 5;
const drawScreenTimer = 15;

const toolList = ["brush", "eraser", "bucket"];
let tool = toolList[0];
let color = "#EE4B2B";
let pixelSize = 16;
let canvasWidth = 33;
let canvasHeight = 24;
let canvasMarginTop = -1*canvasHeight*pixelSize/4;
let canvasMarginLeft = -1*canvasWidth*pixelSize/2;


//mouse
let isDrawing = false;

//colorList no GREY here btw (only on the template maker)
let colorList = {"red":"#EE4B2B", "blue":"#0096FF", "green":"#50C878", "yellow":"#FFEA00",
"orange":"#F28C28", "violet":"#7F00FF", "turquoise":"#40e0d0", "black":"#000000"
, "white":"#FFFFFF"};


//here code

//dcanvas and pcanvas setup
dcanvas.width = canvasWidth * pixelSize;
dcanvas.height = canvasHeight * pixelSize;
dcanvas.style.marginTop = String(canvasMarginTop) + "px";
dcanvas.style.marginLeft = String(canvasMarginLeft) + "px";
pcanvas.width = canvasWidth * pixelSize;
pcanvas.height = canvasHeight * pixelSize;
pcanvas.style.marginTop = String(canvasMarginTop) + "px";
pcanvas.style.marginLeft = String(canvasMarginLeft) + "px";


//color button borders

let colorBtnArray = document.getElementsByClassName("colorBtn");
for (let c = 0; c < colorBtnArray.length; c++){
    let ih = colorBtnArray.item(c).innerHTML;
    colorBtnArray.item(c).style.borderColor = colorList[ih];
}

//pixel arrays

function fillArray(array, fillColor){
    for (let i = 0; i < array.length; i++){
        for (let j = 0; j < array[0].length; j++){
            array[i][j] = fillColor;
        }
    }
}
let templateArray = new Array(canvasHeight).fill(null).map(()=>new Array(canvasWidth).fill(null));
let pixelArray = new Array(canvasHeight).fill(null).map(()=>new Array(canvasWidth).fill(null));
let poisonPixelArray = new Array(canvasHeight).fill(null).map(()=>new Array(canvasWidth).fill(null));
fillArray(templateArray, "#FFFFFF");
fillArray(pixelArray, "#FFFFFF");
fillArray(poisonPixelArray, "#FFFFFF");

//for template array : #white, #000000, #FFFFFF


//events
dcanvas.addEventListener("mousedown", function(e){
    isDrawing = true;
    if (tool === "bucket"){
        bucketFill(dcanvas, e);
    }
    else if(tool === "eraser" || tool === "brush"){
        paintPixel(dcanvas, e);
    }
});
dcanvas.addEventListener("mouseout", function(e){
    isDrawing = false;
})
dcanvas.addEventListener("mouseup", function(e){
    isDrawing = false;
})
dcanvas.addEventListener("mousemove", function(e){
    if (isDrawing && tool !== "bucket"){
        paintPixel(dcanvas, e);
    }
})


//functions

function clearCanvas(){
    ctx.clearRect(0, 0, dcanvas.width, dcanvas.height);
    for (let i = 0; i < pixelArray.length; i++){
        for (let j = 0; j < pixelArray[0].length; j++){
            if (templateArray[i][j]==="#FFFFFF"){
                pixelArray[i][j] = "#FFFFFF";
            }
        }
    }
    drawGrid();
    refresh();
}

function refresh(){
    ctx.clearRect(0, 0, dcanvas.width, dcanvas.height);
    for (let i = 0; i < pixelArray.length; i++){
        for (let j = 0; j < pixelArray[0].length; j++){
            ctx.fillStyle = pixelArray[i][j];
            ctx.fillRect(j*pixelSize,i*pixelSize,pixelSize,pixelSize);
        }
    }
    drawGrid();
}

function drawGrid(){
    ctx.strokeStyle = "#b7b7b7";
    ctx.lineWidth = 1;
    for (let i = 0; i < templateArray.length; i++){
        for (let j = 0; j < templateArray[0].length; j++){
            if (templateArray[i][j] === "#FFFFFF"){
                drawLine([j*pixelSize,i*pixelSize], [(j+1)*pixelSize,i*pixelSize]);
                drawLine([(j+1)*pixelSize,i*pixelSize], [(j+1)*pixelSize,(i+1)*pixelSize]);
                drawLine([(j+1)*pixelSize,(i+1)*pixelSize], [j*pixelSize,(i+1)*pixelSize]);
                drawLine([j*pixelSize,(i+1)*pixelSize], [j*pixelSize,i*pixelSize]);
            }
        }
    }
}

function setTool(newTool){
    tool = toolList[newTool];
    displayTool.innerHTML = "current tool: " + tool;
}

function paintPixel(canvas, event){
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    x = Math.floor(x/pixelSize);
    y = Math.floor(y/pixelSize);
    if (templateArray[y][x] === "#FFFFFF"){
        if (tool === "brush"){
            pixelArray[y][x] = color;
        }
        else if (tool === "eraser"){
            pixelArray[y][x] = "#FFFFFF";
        }
    }
    refresh();
}

function bucketFill(canvas, event){
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    x = Math.floor(x/pixelSize);
    y = Math.floor(y/pixelSize);
    let prevColor = pixelArray[y][x];
    if (templateArray[y][x] === "#FFFFFF"){
        let visited = new Array(canvasHeight).fill(null).map(()=>new Array(canvasWidth).fill(null));
        for (let i = 0; i < visited.length; i++){
            for (let j = 0; j < visited[0].length; j++){
                visited[i][j] = 0;
            }
        }
        spreadPaint(dcanvas, visited, prevColor, x, y);
        refresh();
    }
}
function spreadPaint(canvas, visited, pColor, x, y){
    pixelArray[y][x] = color;
    visited[y][x] = 1;
    if (y>0&&pixelArray[y-1][x]===pColor&&visited[y-1][x]===0){
        spreadPaint(canvas, visited, pColor, x, y-1);
    }
    if (y<pixelArray.length-1&&pixelArray[y+1][x]===pColor&&visited[y+1][x]===0){
        spreadPaint(canvas, visited, pColor, x, y+1);
    }
    if (x>0&&pixelArray[y][x-1]===pColor&&visited[y][x-1]===0){
        spreadPaint(canvas, visited, pColor, x-1, y);
    }
    if (x<pixelArray[0].length-1&&pixelArray[y][x+1]===pColor&&visited[y][x+1]===0){
        spreadPaint(canvas, visited, pColor, x+1, y);
    }
}

function drawLine(begin, end) {
    ctx.beginPath();
    ctx.moveTo(...begin);
    ctx.lineTo(...end);
    ctx.stroke();
}

function setColor(newColor){
    color = newColor;
    displayColor.innerHTML = "current color: " + color;
    colorBox.style.backgroundColor = color;
}

//update timer
function updateTimer(time){
    timeLeft.innerHTML = String(time) + " seconds left"
}

//export
function exportTemp(){
    for (let i = 0; i < templateArray.length; i++){
        for (let j = 0; j < templateArray[0].length; j++){
            if(templateArray[i][j] === "#white" || templateArray[i][j] === "#FFFFFF"){
                pixelArray[i][j] = "#FFFFFF";
            }
            else if (templateArray[i][j] === "#000000"){pixelArray[i][j] = "#000000";}
        }
    }
    refresh();
}

//poisonCanvas "refresh"
function poisonRefresh(){
    pctx.clearRect(0, 0, pcanvas.width, pcanvas.height);
    for (let i = 0; i < poisonPixelArray.length; i++){
        for (let j = 0; j < poisonPixelArray[0].length; j++){
            pctx.fillStyle = poisonPixelArray[i][j];
            pctx.fillRect(j*pixelSize,i*pixelSize,pixelSize,pixelSize);
        }
    }
}

const youDied = document.getElementById("youDied");
youDied.style.visibility = "hidden";

const winScreen = document.getElementById("winScreen");
winScreen.style.visibility = "hidden";

//start the rounds
socket.on("start round", (sendPoison, sendTemplate, deadPlayers) => {
    if (!gameEnded){
        killScreen.style.visibility = "hidden";
        nameBoard.style.visibility = "hidden";
        game.style.visibility = "hidden"; //
        timer.style.visibility = "hidden"; //make visible
        adminButton.style.visibility = "hidden";
        startGameBtn.style.visibility = "hidden";
        butterfliesLoaded.style.visibility = "hidden";
    
        poisonPixelArray = sendPoison;
        templateArray = sendTemplate;
        exportTemp();
        poisonRefresh();
        preview.style.visibility = "visible";
        setTimeout(() => {
            preview.style.visibility = "hidden";
            timer.style.visibility = "visible";
            if (!deadPlayers.includes(id)){
                game.style.visibility = "visible";
                let left = drawScreenTimer;
                const timerInt = setInterval(() => {
                    updateTimer(left);
                    left--;
                    if (left === -1){
                        clearInterval(timerInt);
                        setTimeout(() => {
                            socket.emit("done coloring", pixelArray, sendPoison);
                        }, 500);
                    }
                }, 1000)
            }
            else{
                youDied.style.visibility = "visible";
            }
            
        }, 5000)
    }
})

const deadArray = new Array(canvasHeight).fill(null).map(()=>new Array(canvasWidth).fill(null));
const smolPlayers = document.getElementById("smolPlayers");
const smolCaptions = document.getElementById("smolCaptions");

function refreshSmol(values, smolpx){
    var smolChildren = document.getElementById("smolPlayers").querySelectorAll(".smol");
    for (let k = 0; k < smolChildren.length; k++){
        var newCtx = smolChildren[k].getContext("2d");
        newCtx.clearRect(0,0,smolpx*canvasWidth, smolpx*canvasHeight);
        for (let i = 0; i < values[k].length; i++){
            for (let j = 0; j < values[k][0].length; j++){
                newCtx.fillStyle = values[k][i][j];
                newCtx.fillRect(j*smolpx,i*smolpx,smolpx,smolpx);
            }
        }
    }
}

socket.on("toKillScreen", (playerArrays, players, loser, skullArray) => {
    clearCanvas();
    youDied.style.visibility = "hidden";
    nameBoard.style.visibility = "hidden";
    game.style.visibility = "hidden";
    startGameBtn.style.visibility = "hidden";
    adminButton.style.visibility = "hidden";
    killScreen.style.visibility = "visible";
    timer.style.visibility = "visible";
    let left = killScreenTimer;

    let smolPixel = 6;

    while (smolPlayers.firstChild) {
        smolPlayers.firstChild.remove()
    }
    let values = [];
    for (const [key, value] of Object.entries(playerArrays)) {
        var smol = document.createElement("canvas");
        smol.classList.add("smol");
        
        smol.width = canvasWidth * smolPixel;
        smol.height = canvasHeight * smolPixel;
        var nameCaption = document.createElement("p");
        var text = document.createTextNode(players[key]);
        nameCaption.appendChild(text);
        smolPlayers.appendChild(smol);
        //smolCaptions.appendChild(nameCaption);
        smolPlayers.appendChild(nameCaption);
        let newArr = new Array(canvasHeight).fill(null).map(()=>new Array(canvasWidth).fill(null));
        for (let i = 0; i < newArr.length; i++){
            for (let j = 0; j < newArr[0].length; j++){
                newArr[i][j] = value[i][j];
            }
        }
        values.push(newArr);
    }

    refreshSmol(values, smolPixel);

    
    const timerInt = setInterval(() => {
        
        updateTimer(left);
        left--;
        if (left === -1){
            clearInterval(timerInt);
            setTimeout(()=>{
                loserNum = 0;
                for (const [key, value] of Object.entries(playerArrays)){
                    if (key === loser){
                        for (let m = 0; m < canvasHeight; m++){
                            for (let n = 0; n < canvasWidth; n++){
                                
                                values[loserNum][m][n] = skullArray[m][n];
                            }
                        }
                    }
                    loserNum++;
                }
                refreshSmol(values, smolPixel);
                setTimeout(() => {
                    socket.emit("done killScreen", loser);
                }, 3000);
            }, 100);


        }
    }, 1000)
})

socket.on("toWinScreen", (players, winner, deadPlayers)=>{
    gameEnded = true;
    winScreen.style.visibility = "visible";
    var winName = document.createElement("h1");
    let winText = players[winner] + " is the winner!";
    if (winner === id){winText = "YOU are the winner!";}
    var text = document.createTextNode(winText);
    winName.appendChild(text);
    winScreen.appendChild(winName);
    let rankNum = "2";
    for (let i = deadPlayers.length - 1; i >= 0; i--){
        var place = document.createElement("p");
        var placeTxt = "rank " + rankNum + ": " + players[deadPlayers[i]];
        var t = document.createTextNode(placeTxt);
        place.appendChild(t);
        winScreen.appendChild(place);
        rankNum++;
    }
})
