const express = require('express');
const List = require('../models/List');
const Board = require('../models/Board');
const auth = require('../middleware/auth');

const router = express.Router();

// Create list
router.post('/', auth, async (req, res) => {
  try {
    const { title, board, position } = req.body;
    // Check if user is a member of the board
    const boardDoc = await Board.findById(board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const list = new List({ title, board, position });
    await list.save();
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all lists for a board
router.get('/board/:boardId', auth, async (req, res) => {
  try {
    const boardDoc = await Board.findById(req.params.boardId);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const lists = await List.find({ board: req.params.boardId }).sort('position');
    res.json(lists);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single list by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ message: 'List not found' });
    // Check if user is a member of the board
    const boardDoc = await Board.findById(list.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update list
router.put('/:id', auth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ message: 'List not found' });
    // Check if user is a member of the board
    const boardDoc = await Board.findById(list.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    list.title = req.body.title || list.title;
    list.position = req.body.position !== undefined ? req.body.position : list.position;
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete list
router.delete('/:id', auth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ message: 'List not found' });
    // Check if user is a member of the board
    const boardDoc = await Board.findById(list.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await list.remove();
    res.json({ message: 'List deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Move/reorder lists within a board
router.patch('/reorder/:boardId', auth, async (req, res) => {
  try {
    const { listOrder } = req.body; // array of list IDs in new order
    const boardDoc = await Board.findById(req.params.boardId);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    // Update position for each list
    for (let i = 0; i < listOrder.length; i++) {
      await List.findByIdAndUpdate(listOrder[i], { position: i });
    }
    res.json({ message: 'Lists reordered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 