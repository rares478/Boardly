const express = require('express');
const Invitation = require('../models/Invitation');
const Board = require('../models/Board');
const auth = require('../middleware/auth');

const router = express.Router();

// Send an invite
router.post('/', auth, async (req, res) => {
  try {
    const { toUser, board } = req.body;
    // Prevent duplicate invites
    const existing = await Invitation.findOne({ toUser, board, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'User already invited' });
    const invite = new Invitation({
      toUser,
      fromUser: req.user.id,
      board,
    });
    await invite.save();
    res.status(201).json(invite);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all invites for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const invites = await Invitation.find({ toUser: req.user.id, status: 'pending' })
      .populate('fromUser', 'username email')
      .populate('board', 'title');
    res.json(invites);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept invite
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const invite = await Invitation.findById(req.params.id);
    if (!invite || invite.toUser.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Invite not found' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ message: 'Invite already handled' });
    }
    // Add user to board
    const board = await Board.findById(invite.board);
    if (!board.members.includes(req.user.id)) {
      board.members.push(req.user.id);
      await board.save();
    }
    invite.status = 'accepted';
    await invite.save();
    res.json({ message: 'Invite accepted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Decline invite
router.post('/:id/decline', auth, async (req, res) => {
  try {
    const invite = await Invitation.findById(req.params.id);
    if (!invite || invite.toUser.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Invite not found' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ message: 'Invite already handled' });
    }
    invite.status = 'declined';
    await invite.save();
    res.json({ message: 'Invite declined' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 