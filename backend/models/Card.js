const mongoose = require('mongoose');

const labelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
}, { _id: false });

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  checked: { type: Boolean, default: false },
}, { _id: true });

const checklistSchema = new mongoose.Schema({
  title: { type: String, required: true },
  items: [checklistItemSchema],
}, { _id: true });

const cardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  labels: [labelSchema],
  dueDate: { type: Date },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  position: { type: Number, required: true },
  checklists: [checklistSchema],
}, { timestamps: true });

module.exports = mongoose.model('Card', cardSchema); 