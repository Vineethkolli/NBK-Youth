import Game from '../models/Game.js';

export const gameController = {
  // Get all games
  getAllGames: async (req, res) => {
    try {
      const games = await Game.find().sort('-createdAt');
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch games' });
    }
  },

  // Create game
  createGame: async (req, res) => {
    try {
      const game = await Game.create({
        ...req.body,
        createdBy: req.user.id
      });
      res.status(201).json(game);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create game' });
    }
  },

  // Update game
  updateGame: async (req, res) => {
    try {
      const game = await Game.findByIdAndUpdate(
        req.params.id,
        { ...req.body },
        { new: true }
      );
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update game' });
    }
  },

  // Delete game
  deleteGame: async (req, res) => {
    try {
      await Game.findByIdAndDelete(req.params.id);
      res.json({ message: 'Game deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete game' });
    }
  },

  // Add player
  addPlayer: async (req, res) => {
    try {
      const game = await Game.findById(req.params.id);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      game.players.push({
        ...req.body,
        createdBy: req.user.id
      });
      await game.save();
      res.status(201).json(game);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add player' });
    }
  },

  // Update player
  updatePlayer: async (req, res) => {
    try {
      const game = await Game.findById(req.params.gameId);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      const player = game.players.id(req.params.playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      Object.assign(player, req.body);
      await game.save();
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update player' });
    }
  },

  // Delete player
  deletePlayer: async (req, res) => {
    try {
      const game = await Game.findById(req.params.gameId);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      game.players.pull(req.params.playerId);
      await game.save();
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete player' });
    }
  }
};