import Game from '../models/Game.js';
import { logActivity } from '../middleware/activityLogger.js';

export const gameController = {

  getAllGames: async (req, res) => {
    try {
      const games = await Game.find().sort('-createdAt');
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch games' });
    }
  },


  createGame: async (req, res) => {
    try {
      const existingGame = await Game.findOne({ name: req.body.name });
      if (existingGame) {
        return res.status(400).json({ message: 'Game name already exists. Please choose a different name.' });
      }
  
      const game = await Game.create({
        ...req.body,
        createdBy: req.user.id
      });

      await logActivity(
        req,
        'CREATE',
        'Game',
        game._id.toString(),
        { before: null, after: game.toObject() },
        `Game "${game.name}" created by ${req.user.name}`
      );

      res.status(201).json(game);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create game' });
    }
  },
  

updateGame: async (req, res) => {
  try {
    const originalGame = await Game.findById(req.params.id);
    if (!originalGame) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const existingGame = await Game.findOne({
      name: req.body.name,
      _id: { $ne: req.params.id }, 
    });

    if (existingGame) {
      return res.status(400).json({ message: 'Game name already exists. Please choose a different name.' });
    }

    const originalData = originalGame.toObject();

    const game = await Game.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    await logActivity(
      req,
      'UPDATE',
      'Game',
      game._id.toString(),
      { before: originalData, after: game.toObject() },
      `Game "${game.name}" updated by ${req.user.name}`
    );

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update game' });
  }
},


  deleteGame: async (req, res) => {
    try {
      const game = await Game.findById(req.params.id);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      const originalData = game.toObject();

      await logActivity(
        req,
        'DELETE',
        'Game',
        game._id.toString(),
        { before: originalData, after: null },
        `Game "${game.name}" deleted by ${req.user.name}`
      );

      await Game.findByIdAndDelete(req.params.id);
      res.json({ message: 'Game deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete game' });
    }
  },


  addPlayer: async (req, res) => {
    try {
      const game = await Game.findById(req.params.id);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }
  
      const isDuplicateName = game.players.some(player => player.name === req.body.name);
      if (isDuplicateName) {
        return res.status(400).json({ message: 'Player name already exists. Please choose a different name.' });
      }
  
      game.players.push({
        ...req.body,
        createdBy: req.user.id
      });
      await game.save();

      await logActivity(
        req,
        'CREATE',
        'Game',
        game._id.toString(),
        { before: null, after: { playerName: req.body.name } },
        `Player "${req.body.name}" added to game "${game.name}" by ${req.user.name}`
      );

      const updatedGame = await Game.findById(req.params.id);
      res.status(201).json(updatedGame);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add player' });
    }
  },


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
  
      const isDuplicateName = game.players.some(
        p => p.name === req.body.name && p._id.toString() !== req.params.playerId
      );
      if (isDuplicateName) {
        return res.status(400).json({ message: 'Player name already exists. Please choose a different name.' });
      }
  
      const originalPlayerData = { ...player.toObject() };

      Object.assign(player, req.body);
      await game.save();
  
      await logActivity(
        req,
        'UPDATE',
        'Game',
        game._id.toString(),
        { before: originalPlayerData, after: { ...player.toObject() } },
        `Player "${player.name}" updated in game "${game.name}" by ${req.user.name}`
      );

      res.json(game);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update player' });
    }
  },
  

  deletePlayer: async (req, res) => {
    try {
      const game = await Game.findById(req.params.gameId);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      const player = game.players.id(req.params.playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      const originalPlayerData = { ...player.toObject() };

      await logActivity(
        req,
        'DELETE',
        'Game',
        game._id.toString(),
        { before: originalPlayerData, after: null },
        `Player "${player.name}" deleted from game "${game.name}" by ${req.user.name}`
      );

      game.players.pull(req.params.playerId);
      await game.save();

      const updatedGame = await Game.findById(req.params.gameId);
      res.json(updatedGame);
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete player' });
    }
  }
};