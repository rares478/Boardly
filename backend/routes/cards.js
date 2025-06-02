const express = require('express');
const Card = require('../models/Card');
const List = require('../models/List');
const Board = require('../models/Board');
const auth = require('../middleware/auth');

const router = express.Router();

// Create card
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, list, position, checklists } = req.body;
    const listDoc = await List.findById(list);
    if (!listDoc) return res.status(404).json({ message: 'List not found' });
    // Check if user is a member of the board
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const card = new Card({ title, description, list, position, checklists });
    await card.save();
    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all cards for a list
router.get('/list/:listId', auth, async (req, res) => {
  try {
    const listDoc = await List.findById(req.params.listId);
    if (!listDoc) return res.status(404).json({ message: 'List not found' });
    // Check if user is a member of the board
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const cards = await Card.find({ list: req.params.listId }).sort('position');
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single card by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id).populate('members', 'username email');
    if (!card) return res.status(404).json({ message: 'Card not found' });
    // Check if user is a member of the board
    const listDoc = await List.findById(card.list);
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update card
router.put('/:id', auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    const listDoc = await List.findById(card.list);
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    card.title = req.body.title || card.title;
    card.description = req.body.description || card.description;
    card.position = req.body.position !== undefined ? req.body.position : card.position;
    card.list = req.body.list || card.list;
    if (req.body.checklists !== undefined) card.checklists = req.body.checklists;
    await card.save();
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete card
router.delete('/:id', auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    const listDoc = await List.findById(card.list);
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await card.remove();
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Move/reorder cards within a list or between lists
router.patch('/reorder/:listId', auth, async (req, res) => {
  try {
    const { cardOrder, targetListId } = req.body; // array of card IDs in new order, and the target list ID
    const listDoc = await List.findById(targetListId);
    if (!listDoc) return res.status(404).json({ message: 'List not found' });
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    // Update position and list for each card
    for (let i = 0; i < cardOrder.length; i++) {
      await Card.findByIdAndUpdate(cardOrder[i], { position: i, list: targetListId });
    }
    res.json({ message: 'Cards reordered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update card details
router.patch('/:id', auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    const listDoc = await List.findById(card.list);
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    // Update allowed fields
    if (req.body.title !== undefined) card.title = req.body.title;
    if (req.body.description !== undefined) card.description = req.body.description;
    if (req.body.labels !== undefined) card.labels = req.body.labels;
    if (req.body.dueDate !== undefined) {
      if (!req.body.dueDate) {
        card.dueDate = undefined;
      } else {
        card.dueDate = req.body.dueDate;
      }
    }
    if (req.body.members !== undefined) card.members = req.body.members;
    if (req.body.checklists !== undefined) card.checklists = req.body.checklists;
    await card.save();
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a checklist to a card
router.post('/:cardId/checklists', auth, async (req, res) => {
  try {
    const { title, items } = req.body;
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    const listDoc = await List.findById(card.list);
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const checklist = { title, items: items || [] };
    card.checklists.push(checklist);
    await card.save();
    res.status(201).json(card.checklists[card.checklists.length - 1]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add an item to a checklist
router.post('/:cardId/checklists/:checklistId/items', auth, async (req, res) => {
  try {
    const { text, checked } = req.body;
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    const listDoc = await List.findById(card.list);
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const checklist = card.checklists.id(req.params.checklistId);
    if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
    const item = { text, checked: !!checked };
    checklist.items.push(item);
    await card.save();
    res.status(201).json(checklist.items[checklist.items.length - 1]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a checklist item
router.patch('/:cardId/checklists/:checklistId/items/:itemId', auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    const listDoc = await List.findById(card.list);
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const checklist = card.checklists.id(req.params.checklistId);
    if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
    const item = checklist.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Checklist item not found' });
    if (req.body.text !== undefined) item.text = req.body.text;
    if (req.body.checked !== undefined) item.checked = req.body.checked;
    await card.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a checklist item
router.delete('/:cardId/checklists/:checklistId/items/:itemId', auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    const listDoc = await List.findById(card.list);
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const checklist = card.checklists.id(req.params.checklistId);
    if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
    const item = checklist.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Checklist item not found' });
    item.remove();
    await card.save();
    res.json({ message: 'Checklist item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a member to a card
router.post('/:cardId/members', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    const listDoc = await List.findById(card.list);
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!boardDoc.members.includes(userId)) {
      return res.status(400).json({ message: 'User is not a member of the board' });
    }
    if (!card.members.includes(userId)) {
      card.members.push(userId);
      await card.save();
    }
    await card.populate('members', 'username email');
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a member from a card
router.delete('/:cardId/members/:userId', auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    const listDoc = await List.findById(card.list);
    const boardDoc = await Board.findById(listDoc.board);
    if (!boardDoc || !boardDoc.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    card.members = card.members.filter(id => id.toString() !== req.params.userId);
    await card.save();
    await card.populate('members', 'username email');
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 