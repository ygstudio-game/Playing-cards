class Player {
  constructor(id, name, isHost = false) {
    this.id = id;
    this.name = name;
    this.isHost = isHost;
  }

  toJSON() {
    return {
      id: this.id,
      playerName: this.name,
      isHost: this.isHost
    };
  }
}

module.exports = Player;