const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');
const Game = require('./server/game/Game');
const Player = require('./server/game/Player');
const { generateRoomCode } = require('./server/utils/generateId');
const { log } = require('console');

dotenv.config();
const app = express();
const server = http.createServer(app);

// Configure CORS properly
const io = new Server(server, {
  cors: {
    // origin: process.env.CLIENT_URL || 'http://localhost:3000',
    origin:   'https://playing-cards-tau.vercel.app',
    methods: ['GET', 'POST'],
    transports: ['websocket'],

  }
});

// Static files serving
app.use(express.static(path.join(__dirname, '/client/public')));

// SPA fallback route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/client/public/index.html'));
});
app.get('/css/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/public/styles/main.css'));
  });
  
const activeGames = new Map();

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // Room creation handler
  socket.on('createRoom', ({ playerName, maxPlayers }) => {
    try {
      const roomCode = generateRoomCode();
      const game = new Game(roomCode, parseInt(maxPlayers));
      const player = new Player(socket.id, playerName, true);
      
      game.addPlayer(player);
      activeGames.set(roomCode, game);
      
      socket.join(roomCode);
      socket.emit('roomCreated', { 
        roomCode,
        playerId: player.id,
        maxPlayers: game.maxPlayers,
        playerName: playerName
      });
      updateRoomPlayers(roomCode);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Room joining handler
  socket.on('joinRoom', ({ roomCode, playerName }) => {
    try {
      const code = roomCode.toUpperCase();
      const game = activeGames.get(code);
      
      if (!game) throw new Error('Room not found');
      if (game.players.size >= game.maxPlayers) throw new Error('Room full');
      
      const player = new Player(socket.id, playerName);
      game.addPlayer(player);
      
      socket.join(code);
    socket.to(code).emit('playerJoined', {
      roomCode: code,
      players: game.getPlayers(),
      maxPlayers: game.maxPlayers
    });
      updateRoomPlayers(code);
      socket.emit('playerJoined', {
        roomCode: code,
        players: game.getPlayers(),
        maxPlayers: game.maxPlayers

      });
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Game start handler
  socket.on('startGame', ({ roomCode }) => {
    try {
      const game = activeGames.get(roomCode);
      if (!game) throw new Error('Room not found');
      
      game.startGame();
      io.to(roomCode).emit('gameStarted', {
        players: game.getPlayers(),
        playerCards: game.playerHands,
        currentPlayerIndex: game.currentPlayerIndex
      });

      
    } catch (error) {
      socket.emit('error', error.message);
 
    }
  });
  socket.on('getPlayers', ( roomCode ) => {
    try {
      const players = getPlayersInRoom(roomCode);
      socket.emit('playersList', players);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });
  
  // Card play handler
  socket.on('playCards', ({ roomCode, playerId, cardIndices, claim }) => {
    try {
      const game = activeGames.get(roomCode);
      if (!game) throw new Error('Room not found');
      const result = game.playCards(playerId, cardIndices, claim);
      
      io.to(roomCode).emit('cardsPlayed', result);
      
    } catch (error) {
      socket.emit('error', error.message);

    }
  });
  socket.on('skipTurn', ({ roomCode, playerId}) => {
    
    try {
      const game = activeGames.get(roomCode);
      if (!game) throw new Error('Room not found');
      const result = game.skipTurn(playerId);
      console.log(result);
      
      
      io.to(roomCode).emit('turnSkipped', result);
      
    } catch (error) {
      socket.emit('error', error.message);
    }
  });
  socket.on('challenge', ({ roomCode, playerId}) => {
    
    try {
      const game = activeGames.get(roomCode);
      if (!game) throw new Error('Room not found');
      const result = game.handleChallenge(playerId);
        console.log(result);
        
      io.to(roomCode).emit('challengeResult', result);
      
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    activeGames.forEach((game, roomCode) => {
      if (game.removePlayer(socket.id)) {
        if (game.players.size === 0) {
          activeGames.delete(roomCode);
        } else {
          updateRoomPlayers(roomCode);
        }
      }
    });
  });

  // Helper function to update room players
  function updateRoomPlayers(roomCode) {
    const game = activeGames.get(roomCode);
    
    if (game) {
      io.to(roomCode).emit('playersUpdated', {
        players: game.getPlayers(),
        maxPlayers: game.maxPlayers
      });
    }
  }
});
function getPlayersInRoom(roomCode) {
  // console.log(roomCode);
  
  // console.log(activeGames.get(roomCode));
  const game = activeGames.get(roomCode);
  
  if (!game) {
    throw new Error('Room not found');
  }
  return game.getPlayers();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Client: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});