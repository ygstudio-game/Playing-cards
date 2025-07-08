const gameState = {
    players: [],
    currentPlayerIndex: 0,
    discardPile: [],
    currentPlay: null,
    consecutiveSkips: 0,
    gameLog: [],
    deck: [],
    playerCards: [],
    gameStarted: false,
    roomCode: '',
    isHost: false,
    playerName: '',
    maxPlayers: 3,
    playerId: '',
    socket: null,
    isMyTurn: false,
    connectionStatus: 'disconnected',
    reconnectAttempts: 0
};
let elements;
function initializeElements() {
 elements = {
        mainMenu: document.getElementById('main-menu'),
        createRoomModal: document.getElementById('create-room-modal'),
        joinRoomModal: document.getElementById('join-room-modal'),
        roomLobby: document.getElementById('room-lobby'),
        gameArea: document.getElementById('game-area'),
        playerCardsContainer: document.getElementById('player-cards'),
        playersList: document.getElementById('players-list'),
        discardPileContainer: document.getElementById('discard-pile'),
        currentPlayDisplay: document.getElementById('current-play'),
        currentClaimText: document.getElementById('current-claim'),
        gameLog: document.getElementById('game-log'),
        playCardsBtn: document.getElementById('play-cards-btn'),
        skipBtn: document.getElementById('skip-btn'),
        challengeBtn: document.getElementById('challenge-btn'),
        newGameBtn: document.getElementById('new-game-btn'),
        rulesBtn: document.getElementById('rules-btn'),
        rulesModal: document.getElementById('rules-modal'),
        closeRulesBtns: document.querySelectorAll('.close-rules-btn'),
        winnerModal: document.getElementById('winner-modal'),
        winnerText: document.getElementById('winner-text'),
        newGameWinnerBtn: document.getElementById('new-game-winner-btn'),
        closeWinnerBtn: document.getElementById('close-winner-btn'),
        claimSelect: document.getElementById('claim-select'),
        claimCount: document.getElementById('claim-count'),
        selectedCount: document.getElementById('selected-count'),
        createRoomBtn: document.getElementById('create-room-btn'),
        joinRoomBtn: document.getElementById('join-room-btn'),
        rulesMenuBtn: document.getElementById('rules-menu-btn'),
        closeCreateRoom: document.getElementById('close-create-room'),
        closeJoinRoom: document.getElementById('close-join-room'),
        hostName: document.getElementById('host-name'),
        playerCount: document.getElementById('player-count'),
        startRoomBtn: document.getElementById('start-room-btn'),
        playerName: document.getElementById('player-name'),
        roomCode: document.getElementById('room-code'),
        joinRoomSubmit: document.getElementById('join-room-submit'),
        displayRoomCode: document.getElementById('display-room-code'),
        copyRoomCode: document.getElementById('copy-room-code'),
        currentPlayers: document.getElementById('current-players'),
        maxPlayers: document.getElementById('max-players'),
        lobbyPlayers: document.getElementById('lobby-players'),
        leaveLobbyBtn: document.getElementById('leave-lobby-btn'),
        startGameBtn: document.getElementById('start-game-btn'),
        loadingScreen: document.getElementById('loading-screen'),
        serverStatus: document.getElementById('server-status')
    };
    
    setupEventListeners();
}
 // Set up all event listeners
 function setupEventListeners() {
    // Game action buttons
    elements.playCardsBtn.addEventListener('click', playCards);
    elements.skipBtn.addEventListener('click', skipTurn);
    elements.challengeBtn.addEventListener('click', challengePlay);
    elements.newGameBtn.addEventListener('click', () => {
        gameState.socket.emit('newGame', { roomCode: gameState.roomCode });
    });
    
    // Menu buttons
    elements.createRoomBtn.addEventListener('click', () => {
        elements.createRoomModal.classList.remove('hidden');
    });
    
    elements.joinRoomBtn.addEventListener('click', () => {
        elements.joinRoomModal.classList.remove('hidden');
    });
    
    elements.rulesMenuBtn.addEventListener('click', () => {
        elements.rulesModal.classList.remove('hidden');
    });
    
    elements.closeCreateRoom.addEventListener('click', () => {
        elements.createRoomModal.classList.add('hidden');
    });
    
    elements.closeJoinRoom.addEventListener('click', () => {
        elements.joinRoomModal.classList.add('hidden');
    });
    
    // Room creation/joining
    elements.startRoomBtn.addEventListener('click', () => {
        const name = elements.hostName.value.trim();
        const playerCount = parseInt(elements.playerCount.value);
        
        if (!name) {
            showToast('Please enter your name');
            return;
        }
        
        gameState.playerName = name;
        gameState.socket.emit('createRoom', {
            playerName: name,
            maxPlayers: playerCount
        });
    });
    
    elements.joinRoomSubmit.addEventListener('click', () => {
        const name = elements.playerName.value.trim();
        const roomCode = elements.roomCode.value.trim().toUpperCase();
        
        if (!name) {
            showToast('Please enter your name');
            return;
        }
        
        if (!roomCode || roomCode.length !== 5) {
            showToast('Please enter a valid 5-character room code');
            return;
        }
        
        gameState.playerName = name;
        gameState.socket.emit('joinRoom', {
            playerName: name,
            roomCode: roomCode
        });
    });
    
    // Lobby controls
    elements.copyRoomCode.addEventListener('click', () => {
        navigator.clipboard.writeText(gameState.roomCode).then(() => {
            showToast('Room code copied to clipboard!');
        });
    });
    
    elements.leaveLobbyBtn.addEventListener('click', () => {
        gameState.socket.emit('leaveRoom', {
            roomCode: gameState.roomCode,
            playerId: gameState.playerId
        });
        transitionToScreen(elements.roomLobby, elements.mainMenu);
    });
    
    elements.startGameBtn.addEventListener('click', () => {
        gameState.socket.emit('startGame', {
            roomCode: gameState.roomCode
        });
    });
    
    // Modal controls
    elements.closeRulesBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.rulesModal.classList.add('hidden');
        });
    });
    
    elements.newGameWinnerBtn.addEventListener('click', () => {
        elements.winnerModal.classList.add('hidden');
        gameState.socket.emit('newGame', { roomCode: gameState.roomCode });
    });
    
    elements.closeWinnerBtn.addEventListener('click', () => {
        elements.winnerModal.classList.add('hidden');
    });
}






socket.on('connection', (socket) => {
    initializeElements();
});