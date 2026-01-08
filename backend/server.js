import process from 'node:process';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from "mongoose";
import cors from 'cors';
import { notFound, errorHandler } from './middleware/error.js';
dotenv.config({ quiet: true });

/*dotenv debug
const result = dotenv.config();
if (result.error) console.error('❌ Dotenv error:', result.error);
console.log('📦 Loaded vars:', result.parsed);
*/

const { API_PORT = 3500, MONGODB_URI } = process.env;
// check if MongoDB address is available via .env
if (!MONGODB_URI) {
  console.error('❌ Check MONGODB_URI in .env');
  process.exit(1);
}


const app = express(); // Перенесено вверх

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Ⓜ️  MongoDB connection established");

    app.listen(API_PORT, () => {
      console.log(`⚽ Vakioveikkaus API started on http://localhost:${API_PORT}`);
      console.log(`💖 Health check with http://localhost:${API_PORT}/api/health`);
    });
  }).catch((err) => {
    console.error("⛔  MongoDB connection error", err.message);
    process.exit(1);

  });

// MODELS -------------------------------------------------
const GameSchema = new mongoose.Schema({
  rows: [{
    state: { type: Number, default: 0 },
    edits: { type: [Number], default: [0, 0, 0] },
    buttons: { type: [Number], default: [0, 0, 0] }
  }],
  lastUpdated: { type: Date, default: Date.now }
});

const GameModel = mongoose.model("Game", GameSchema);


// ROUTES -------------------------------------------------
// 2. Эндпоинт для загрузки (GET)
app.get('/api/game', async (req, res) => {
  try {
    const data = await GameModel.findOne();
    // Если в базе пусто, отдаем дефолтные пустые массивы
    if (!data) {
      return res.json({
        rowMode: new Array(13).fill(0),
        buttonStatus: Array.from({ length: 13 }, () => [0, 0, 0]),
        editValues: Array.from({ length: 13 }, () => [0, 0, 0]),
        results: []
      });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 3. Эндпоинт для сохранения (POST)
app.post('/api/game', async (req, res) => {
  try {
    const updateData = { ...req.body, lastUpdated: new Date() };
    await GameModel.findOneAndUpdate({}, updateData, { upsert: true });
    res.status(200).json({ message: "Успешно сохранено в Atlas" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(notFound); 
app.use(errorHandler);



