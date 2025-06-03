const express = require('express');
const Board = require('../models/Board');
const auth = require('../middleware/auth');

const router = express.Router();

// Create board
router.post('/', auth, async (req, res) => {
  try {
    const board = new Board({
      title: req.body.title,
      description: req.body.description,
      owner: req.user.id,
      members: [req.user.id],
      coverImage: req.body.coverImage,
    });
    await board.save();
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all boards for user
router.get('/', auth, async (req, res) => {
  try {
    const boards = await Board.find({ members: req.user.id });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single board
router.get('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board || !board.members.includes(req.user.id)) {
      return res.status(404).json({ message: 'Board not found' });
    }
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all members of a board
router.get('/:id/members', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id).populate('members', 'username email');
    if (!board || !board.members.some(m => (m._id?.toString?.() || m.toString()) === req.user.id)) {
      return res.status(404).json({ message: 'Board not found' });
    }
    res.json(board.members);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update board
router.put('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board || !board.owner.equals(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    board.title = req.body.title || board.title;
    if (req.body.description !== undefined) board.description = req.body.description;
    if (req.body.coverImage !== undefined) board.coverImage = req.body.coverImage;
    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete board
router.delete('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board || !board.owner.equals(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await board.remove();
    res.json({ message: 'Board deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 