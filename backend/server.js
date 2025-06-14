require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const boardsRoutes = require('./routes/boards');
const listsRoutes = require('./routes/lists');
const cardsRoutes = require('./routes/cards');
const invitationsRoutes = require('./routes/invitations');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'https://boardly-psi.vercel.app',
    'https://boardly-git-server-rares-projects-5c5d3702.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true,
}));
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.send('API is running');
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
    });

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/invitations', invitationsRoutes); 