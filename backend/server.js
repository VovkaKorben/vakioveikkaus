import process from 'node:process';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from "mongoose";
import cors from 'cors';
import { notFound, errorHandler } from './middleware/error.js';
import { valuesDefault } from '../utils.js';
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
  values: {
    type: [[Number]],
    default: valuesDefault
  },
  lastUpdated: { type: Date, default: Date.now }
});
const GameModel = mongoose.model("Game", GameSchema);

const ResultSchema = new mongoose.Schema({
  values: { type: [[Number]], required: true },
  createdAt: { type: Date, default: Date.now }
});
const ResultModel = mongoose.model("Result", ResultSchema);


const Team = mongoose.model('Team', new mongoose.Schema({
  name: String
}), 'teams');
const CurrentTeams = mongoose.model('CurrentTeams', new mongoose.Schema({
  matches: [[{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }]],
  updatedAt: { type: Date, default: Date.now }
}), 'teamsCurrent');
// ROUTES -------------------------------------------------

app.get('/api/numberscreate', async (req, res) => {
  try {
    const data = [];
    for (let r = 0; r < 13; r++) {
      let row = []
      for (let c = 0; c <= 2; c++) {
        row.push(Math.random());
      }
      const sum = row.reduce((a, b) => a + b, 0);
      for (let c = 0; c <= 2; c++) {
        row[c] = Math.round(row[c] / sum * 100)
      }
      data.push(row);
    }

    const updateData = { values: data, lastUpdated: new Date() };
    await NumberModel.findOneAndUpdate({}, updateData, { upsert: true, new: true });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/numbersreset', async (req, res) => {
  try {

    await NumberModel.deleteMany({});
    res.status(200).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 2. Эндпоинт для загрузки (GET)
app.get('/api/game', async (req, res) => {
  try {
    const data = await GameModel.findOne();
    res.json(data.values);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 3. Эндпоинт для сохранения (POST)
app.post('/api/game', async (req, res) => {
  try {
    const updateData = { ...req.body, lastUpdated: new Date() };
    await GameModel.findOneAndUpdate({}, updateData, { upsert: true, new: true });
    res.status(200).json({ message: "Успешно сохранено в Atlas" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const rowIsUnique = (newRow, allRows) => {
  return allRows.every((row) => {
    // verify row
    const rowsEqual = row.every((v, i) => v === newRow[i]);
    return !rowsEqual;
  })
}

// NEW CALC ------------------------------------------
const calc2 = (data) => {

  // calc probability ranges
  const probabilities = [];
  for (let r = 0; r < 13; r++) {


    // calc sums
    let nums_sum = 0;
    for (let c = 0; c <= 2; c++) {
      if (data.inputs[r][c] !== 0) {
        nums_sum += data.numbers[r][c];
      }
    }
    // build probabilities "wall"
    let acc = 0.0;
    const t = [];
    for (let c = 0; c <= 2; c++) {
      if (data.inputs[r][c] !== 0) {
        acc += data.numbers[r][c] / nums_sum;
      }
      t.push(acc);
    }
    probabilities.push(t);
  }

  // generate rows
  const allRows = [];
  for (let rowIndex = 0; rowIndex < 128; rowIndex++) {

    // create row
    let newRow;
    do {
      newRow = [];
      probabilities.forEach((w) => {
        const dice = Math.random();
        const range_index = w.findIndex((e) => dice < e);
        newRow.push(range_index);
      })

    } while (!rowIsUnique(newRow, allRows));
    allRows.push(newRow);
  }
  return allRows;
}
app.post('/api/calc2', async (req, res) => {
  try {
    const data = req.body;

    if (Object.keys(data).length === 0) {
      await ResultModel.deleteMany({});
      return res.status(200).json({ message: "Таблица результатов успешно очищена" });
    }

    const calculationResult = calc2(data);

    // Исправлено: пустой фильтр {}, обновление поля values, опции в третьем аргументе
    await ResultModel.findOneAndUpdate(
      {},
      { values: calculationResult, createdAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json(calculationResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ------------------------------------------


// OLD CALC ------------------------------------------
const calc = (data) => {

  // calc probability ranges
  const probabilities = [];
  data.some((row) => {

    const sum = row.reduce((a, b) => a + b, 0);
    if (sum === 0) return true;

    const t = [];
    const k = 1 / sum;
    let acc = 0.0;
    for (let s = 0; s < 3; s++) {
      if (row[s] !== 0)
        acc += k;
      t.push(acc);
    }
    probabilities.push(t);
    return false;
  });




  const allRows = [];
  // generate rows
  for (let rowIndex = 0; rowIndex < 128; rowIndex++) {

    // create row
    let newRow;
    do {
      newRow = [];
      probabilities.forEach((w) => {
        const dice = Math.random();
        const range_index = w.findIndex((e) => dice < e);
        newRow.push(range_index);
      })

    } while (!rowIsUnique(newRow, allRows));
    allRows.push(newRow);
  }
  return allRows;
}
app.post('/api/calc', async (req, res) => {
  try {
    const data = req.body.values;

    if (data === null) {
      await ResultModel.deleteMany({});
      return res.status(200).json({ message: "Таблица результатов успешно очищена" });
    }

    const calculationResult = calc(data);

    // Исправлено: пустой фильтр {}, обновление поля values, опции в третьем аргументе
    await ResultModel.findOneAndUpdate(
      {},
      { values: calculationResult, createdAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json(calculationResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ------------------------------------------

app.get('/api/result', async (req, res) => {
  try {
    const lastResult = await ResultModel.findOne().sort({ createdAt: -1 });

    // Исправлено: обращаемся к values, так как в схеме поле названо именно так
    res.status(200).json(lastResult ? lastResult.values : null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const generateAndSaveNewSet = async () => {
  const teams = await Team.aggregate([
    { $sample: { size: 26 } },
    { $project: { _id: 1 } }
  ]);
  const rid = teams.map(t => t._id);

  const newMatches = [];
  for (let i = 0; i < rid.length; i += 2) {
    newMatches.push([rid[i], rid[i + 1]]);
  }

  // 3. Сохраняем как единственный документ (upsert)
  return await CurrentTeams.findOneAndUpdate(
    {},
    { matches: newMatches, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};
const populateMatchesData = async (matches) => {
  const allIds = matches.flat();
  const teamsData = await Team.find({ _id: { $in: allIds } }).lean();

  return matches.map(pair => {
    return pair.map(id => {
      const team = teamsData.find(t => t._id.toString() === id.toString());
      // Возвращаем только имя строкой, либо заглушку, если команда не найдена
      return team ? team.name : 'Unknown Team';
    });
  });
};
// Получить текущие команды [cite: 5, 6]
app.get('/api/teams', async (req, res) => {
  try {
    let set = await CurrentTeams.findOne().lean();

    // Если пусто — генерируем автоматически
    if (!set) {
      const newDoc = await generateAndSaveNewSet();
      set = newDoc.toObject();
    }

    const populatedMatches = await populateMatchesData(set.matches);

    res.json(populatedMatches);


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/teamsupdate', async (req, res) => {
  try {
    const set = await generateAndSaveNewSet();
    const populatedMatches = await populateMatchesData(set.matches);
    res.json(populatedMatches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(notFound);
app.use(errorHandler);



