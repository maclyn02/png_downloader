// server.js
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

// Connect to MongoDB (choose one of these options)
// For local MongoDB:
const mongoPass = process.env.MONGO_PASS || '';
mongoose.connect(`mongodb+srv://mac:${mongoPass}@cluster0.oyvas.mongodb.net/`)
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

// Schema and model definitions
const userSchema = new mongoose.Schema({
    userId: String,
    adsWatched: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 }
});

const visitSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    count: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);
const Visit = mongoose.model('Visit', visitSchema);

// Express app setup
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set to true if using https
}));

// Routes
app.get('/', (req, res) => {
    if (!req.session.userId) {
        req.session.userId = Math.random().toString(36).substring(7);
        new User({ userId: req.session.userId }).save();
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/ad-viewed', async (req, res) => {
    try {
        await User.findOneAndUpdate(
            { userId: req.session.userId },
            { $inc: { adsWatched: 1 } }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating ad count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/download', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.session.userId });
        if (!user) {
            return res.status(403).json({ error: 'User not found' });
        }
        
        if (user.adsWatched >= 3) {
            await User.findOneAndUpdate(
                { userId: req.session.userId },
                { $inc: { downloads: 1 } }
            );
            return res.download(path.join(__dirname, 'assets', 'image.png'));
        } else {
            return res.status(403).json({ 
                error: `Please watch ${3 - user.adsWatched} more ads before downloading` 
            });
        }
    } catch (error) {
        console.error('Error handling download:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});