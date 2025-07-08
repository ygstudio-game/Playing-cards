class Game {
  constructor(roomCode, maxPlayers) {
    this.roomCode = roomCode;
    this.maxPlayers = maxPlayers;
    this.players = new Map();
    this.playerHands = {}; // Moved initialization here
    this.deck = [];
    this.discardPile = [];
    this.discardHistory = [];
    this.currentPlayerIndex = 0;
    this.gameStarted = false;
    this.currentClaim = null; // Initialize challenge state
    this.currentPlayCount = 0;
    this.currentPlayerId = null;
  }

  addPlayer(player) {
    if (this.players.size >= this.maxPlayers) throw new Error('Room full');
    this.players.set(player.id, player);
  }

  startGame() {
    this.initializeDeck();
    this.shuffleDeck();
    this.dealCards();
    this.gameStarted = true;
  }

  initializeDeck() {
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suits = ['♥', '♦', '♣', '♠'];
    this.deck = suits.flatMap(suit =>
      values.map(value => ({ value, suit, id: Math.random().toString(36).slice(2, 11) }))
    );
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  playCards(playerId, cardIds, claim) {
    // Validate player turn
    const playerIds = Array.from(this.players.keys());
    if (playerIds[this.currentPlayerIndex] !== playerId) {
      throw new Error('Not your turn');
    }

    const playerHand = this.playerHands[playerId];
    if (!playerHand) throw new Error('Player not found or no hand available');
    
    // Validate card ownership
    const playedCards = [];
    for (const id of cardIds) {
      const cardIndex = playerHand.findIndex(card => card.id === id);
      if (cardIndex === -1) throw new Error(`Card ${id} not found in player's hand`);
      playedCards.push(playerHand[cardIndex]);
      playerHand.splice(cardIndex, 1);
    }
    
    this.discardPile.push(...playedCards);
    this.discardHistory.push(...Array(playedCards.length).fill(playerId));
    this.currentClaim = claim;
    this.currentPlayCount = playedCards.length;
    this.currentPlayerId = playerId;
    
    // Move to next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.size;
    
    return {
      playerId,
      playedCards,
      claim,
      discardPile: [...this.discardPile],
      discardHistory: [...this.discardHistory],
      playerCards: {...this.playerHands},
      currentPlayerIndex: this.currentPlayerIndex
    };
  }

  dealCards() {
    const players = Array.from(this.players.values());
    const totalCards = this.deck.length;
    const baseCount = Math.floor(totalCards / players.length);
    const extraCards = totalCards % players.length;
    
    this.playerHands = {};
    let dealt = 0;
    
    players.forEach((player, idx) => {
      const count = baseCount + (idx < extraCards ? 1 : 0);
      this.playerHands[player.id] = this.deck.slice(dealt, dealt + count);
      dealt += count;
    });
    
    this.deck = []; // Clear remaining cards
  }

  removePlayer(playerId) {
    // Adjust turn position if needed
    const playerIds = Array.from(this.players.keys());
    const removedIndex = playerIds.indexOf(playerId);
    
    if (removedIndex !== -1) {
      if (removedIndex < this.currentPlayerIndex) {
        this.currentPlayerIndex--;
      }
      this.players.delete(playerId);
      delete this.playerHands[playerId];
      return true;
    }
    return false;
  }

  getPlayers() {
    return Array.from(this.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      cardCount: this.playerHands[player.id]?.length || 0
    }));
  }

  skipTurn(playerId) {
    const playerIds = Array.from(this.players.keys());
    if (playerIds[this.currentPlayerIndex] !== playerId) {
      throw new Error('Not your turn to skip');
    }

    // this.currentPlayerIndex = (this.currentPlayerIndex + 1) % playerIds.length;
    this.currentPlayerIndex = (this.currentPlayerIndex<2)?(this.currentPlayerIndex+1):0;
    return {
      currentPlayerIndex: this.currentPlayerIndex,
      playerId
    };
  }

  handleChallenge(challengerId) {
    if (!this.currentClaim || this.discardPile.length < this.currentPlayCount) {
      throw new Error('No valid play to challenge');
    }
    
    const lastPlay = this.discardPile.slice(-this.currentPlayCount);
    const isTruthful = lastPlay.every(card => card.value === this.currentClaim.value);
    const penalizedPlayer = isTruthful ? challengerId : this.currentPlayerId;
    
    // Add discard pile to penalized player's hand
    this.playerHands[penalizedPlayer].push(...this.discardPile);
    this.discardPile = [];
    this.discardHistory = [];
    
    // Set turn to next player after penalized player
    const playerIds = Array.from(this.players.keys());
    const penalizedIndex = playerIds.indexOf(penalizedPlayer);
    this.currentPlayerIndex = (penalizedIndex + 1) % playerIds.length;
    
    // Reset challenge state
    this.currentClaim = null;
    this.currentPlayCount = 0;
    this.currentPlayerId = null;
    
    return {
      isTruthful,
      penalizedPlayer,
      playerCards: {...this.playerHands},
      currentPlayerIndex: this.currentPlayerIndex,
      discardPile: this.discardPile,
      discardHistory: this.discardHistory
    };
  }
}

module.exports = Game;