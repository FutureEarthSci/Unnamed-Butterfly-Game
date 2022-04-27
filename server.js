const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const lineReader = require("line-reader");
const { send } = require('process');
const { PassThrough } = require('stream');

//update this along with script.js also GREY should not be here
const colorList = {"red":"#EE4B2B", "blue":"#0096FF", "green":"#50C878", "yellow":"#FFEA00",
"orange":"#F28C28", "violet":"#7F00FF", "turquoise":"#40e0d0", "white":"#FFFFFF"};
const templateWidth = 33;
const templateHeight = 24;
let butterflies = [];
let skullArray = [];

if(true){

  //prototype1 (4 colors, basic boring butterfly)
  let arr1 = [];
  lineReader.eachLine('./templates/prototype1.txt', (line,last) =>{
    arr1.push(line.split(", "));
    if(last){butterflies.push(arr1);}
  })
  //prototype2 (same as prototyp1 but with only 2 colors, top and bottom wings)
  let arr2 = [];
  lineReader.eachLine('./templates/prototype2.txt', (line,last) =>{
    arr2.push(line.split(", "));
    if(last){butterflies.push(arr2);}
  })
  //moth1 (big body, 4 colors)
  let arr3 = [];
  lineReader.eachLine('./templates/moth1.txt', (line,last) =>{
    arr3.push(line.split(", "));
    if(last){butterflies.push(arr3);}
  })
  //coolButterfly1 - kinda small butterfly, edges are colored differently (only 2 colors)
  let arr4 = [];
  lineReader.eachLine('./templates/coolButterfly1.txt', (line,last) =>{
    arr4.push(line.split(", "));
    if(last){butterflies.push(arr4);}
  })
  //polkadot 1 - its got polkadots and 3 colors
  let arr5 = [];
  lineReader.eachLine('./templates/polkadot1.txt', (line,last) =>{
    arr5.push(line.split(", "));
    if(last){butterflies.push(arr5);}
  })
  //monarch 1 - a work of art
  let arr6 = [];
  lineReader.eachLine('./templates/monarch1.txt', (line,last) =>{
    arr6.push(line.split(", "));
    if(last){butterflies.push(arr6);}
  })
  //i = cursed
  let arr7 = [];
  lineReader.eachLine('./templates/i.txt', (line,last) =>{
    arr7.push(line.split(", "));
    if(last){butterflies.push(arr7);}
  })
  //heart.txt
  let arr8 = [];
  lineReader.eachLine('./templates/heart.txt', (line,last) =>{
    arr8.push(line.split(", "));
    if(last){butterflies.push(arr8);}
  })

  lineReader.eachLine('./templates/skullface.txt', (line,last) =>{
    skullArray.push(line.split(", "));
  })

}

let players = {};
let deadPlayers = [];
let playerArrays = {};
let gameStarted = false;
let gameEnded = false;

let numPlayers = 0;
let numResponses = 0;
let currentAns = new Array(templateHeight).fill(null).map(()=>new Array(templateWidth).fill(null));


app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
  //console.log(req);
});

io.on('connection', (socket) => {
  socket.on("new user", (username) => {
    let taken = false;
    for (const [key, value] of Object.entries(players)){
      if (username === value){
        taken = true;
      }
    }
    if (!gameStarted && !taken){
      io.to(socket.id).emit("sendToNameBoard", socket.id);
      players[socket.id] = username;
      io.emit("updateNameBoard", players);
      if (username === "admin"){
        io.to(socket.id).emit("adminOn");
      }
    } else{
      console.log(socket.id, " tried to join after game started or with duplicate name");
    }
  })
  socket.on("disconnect", () => {
    delete(players[socket.id]);
    let ind = deadPlayers.indexOf(socket.id);
    if (ind > -1){deadPlayers.splice(ind, 1);}
    io.emit("updateNameBoard", players);
  })
  socket.on("pingLoaded", () =>{
    io.emit("butterflies loaded", butterflies.length);
  })
  


  socket.on("startGame", () => {
    gameStarted = true;
    //call start of first round
    startRound();
  })
  socket.on("done coloring", (pixelArray, poisonArray) => {
    if (!gameEnded){
      numPlayers = Object.keys(players).length;
      numResponses++;
      playerArrays[socket.id] = new Array(templateHeight).fill(null).map(()=>new Array(templateWidth).fill(null));
      copy2Darray(playerArrays[socket.id], pixelArray);

      if (numResponses >= numPlayers - deadPlayers.length){
        numResponses = 0;
        //work out who dies after collecting all pixel arrays
        let namesIdScores = [];
        copy2Darray(currentAns, poisonArray);
        for (const [key, array] of Object.entries(playerArrays)){
          let score = 0;
          for (let i = 0; i < array.length; i++){
            for (let j = 0; j < array[0].length; j++){
              let ansRGB = hexToRGB(currentAns[i][j]);
              let playerRGB = hexToRGB(array[i][j]);
              for (let k = 0; k < 3; k++){
                score += Math.abs(ansRGB[k] - playerRGB[k])/3;
              }
            }
          }

          let profile = [];
          profile.push(key);
          profile.push(players[key]);
          profile.push(score);
          namesIdScores.push(profile);
          
        }
        
        let maxScore = namesIdScores[0][2];
        let loserArray = [];
        for (let i = 0; i < namesIdScores.length; i++){
          if (namesIdScores[i][2] >= maxScore){maxScore = namesIdScores[i][2];}
        }
        for (let i = 0; i < namesIdScores.length; i++){
          if (namesIdScores[i][2] === maxScore){loserArray.push(namesIdScores[i][0]);}
        }
        let unlucky = randomInt(loserArray.length);
        //return id of loser;
        let loser = loserArray[unlucky];
        shuffle(playerArrays);
        io.emit("toKillScreen", playerArrays, players, loser, skullArray);
        
      }
    }
    
  })

  socket.on("done killScreen", (loser) => {
    if (!gameEnded){
      numPlayers = Object.keys(players).length;
      if (!deadPlayers.includes(loser)){deadPlayers.push(loser);}
      numResponses++;
  
      if (numResponses >= numPlayers){
        numResponses = 0;
        
        //work out who to send the next round to also check if someone won
        playerArrays = {};
        numPlayers = Object.keys(players).length;
        let winner = "";
        if (numPlayers - deadPlayers.length === 1){
          for (const [key, value] of Object.entries(players)){
            if (!deadPlayers.includes(key)){winner = key;}
          }
          //returns name of winner + deadPlayers
          gameEnded = true;
          io.emit("toWinScreen", players, winner, deadPlayers);
        }
        startRound();
      }
    }

  })
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
//192.168.1.17:3000

function startRound(){
  let colors = [];
  for (let key in colorList){
    colors.push(key);
  }
  let randButterfly = butterflies[randomInt(butterflies.length)];
  let sendPoison = new Array(templateHeight).fill(null).map(()=>new Array(templateWidth).fill(null));
  let sendTemplate = new Array(templateHeight).fill(null).map(()=>new Array(templateWidth).fill(null));
  copy2Darray(sendPoison, randButterfly);
  copy2Darray(sendTemplate, randButterfly);

  let seenColorMap = {};
  for (let i = 0; i < randButterfly.length; i++){
    for (let j = 0; j < randButterfly[0].length; j++){
      switch(randButterfly[i][j]){
        case "#808080":
          sendPoison[i][j] = "#FFFFFF";
          sendTemplate[i][j] = "#white";
          break;
        case "#000000":
          break;
        default:
          if (randButterfly[i][j] in seenColorMap){
            sendPoison[i][j] = seenColorMap[randButterfly[i][j]];
            sendTemplate[i][j] = "#FFFFFF";
          } else {
            let random = randomInt(colors.length);
            seenColorMap[randButterfly[i][j]] = colorList[colors[random]];
            colors.splice(random, 1);
            sendPoison[i][j] = seenColorMap[randButterfly[i][j]];
            sendTemplate[i][j] = "#FFFFFF";
          }
      }
    }
  }
  io.emit("start round", sendPoison, sendTemplate, deadPlayers);
}

//random int
function randomInt(max) {
  return Math.floor(Math.random() * max);
}
function copy2Darray(copy, old){
  for (let i = 0; i < old.length; i++){
    for (let j = 0; j < old[0].length; j++){
      copy[i][j] = old[i][j];
    }
  }
}
function shuffle(n) {
  for (let i = n.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = n[i];
    n[i] = n[j];
    n[j] = temp;
  }
}
function hexToRGB(hex){
  let r = hex.substring(1,3);
  let g = hex.substring(3,5);
  let b = hex.substring(5);
  let output = [];
  output.push(parseInt(r, 16));
  output.push(parseInt(g, 16));
  output.push(parseInt(b, 16));
  return output;
}
