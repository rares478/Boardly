const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Invitation', invitationSchema); 