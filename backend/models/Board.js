const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  coverImage: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Board', boardSchema); 