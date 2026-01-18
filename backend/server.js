import process from 'node:process';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from "mongoose";
import cors from 'cors';
import { asyncHandler, notFound, errorHandler } from './middleware/error.js';
import { defaultInput } from '../src/utils.js';
import { prettify } from '../src/debug.js';
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

    const server = app.listen(API_PORT, () => {
      console.log(`⚽ Vakioveikkaus API started on http://localhost:${API_PORT}`);
      console.log(`💖 Health check with http://localhost:${API_PORT}/api/health`);
    });
    server.timeout = 12000;
  }).catch((err) => {
    console.error("⛔  MongoDB connection error", err.message);
    process.exit(1);

  });

// MODELS -------------------------------------------------



const InputSchema = new mongoose.Schema({
  values: {
    type: [[{
      state: { type: Number, default: 0 },
      value: { type: Number, default: 0 }
    }]],
    default: defaultInput
  },
  lastUpdated: { type: Date, default: Date.now }
});
const InputModel = mongoose.model("input", InputSchema);

const OutputSchema = new mongoose.Schema({
  values: { type: [[Number]], required: true }, // 13 * количество реальных рядов
  rowCount: { type: Number, required: true },    // количество реальных рядов
  requestedRows: { type: Number, required: true }, // количество заданных рядов
  createdAt: { type: Date, default: Date.now }
});

const OutputModel = mongoose.model("output", OutputSchema);


const Team = mongoose.model('Team', new mongoose.Schema({ name: String }), 'teams');
const CurrentTeams = mongoose.model('CurrentTeams', new mongoose.Schema({
  matches: [[{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }]],
  updatedAt: { type: Date, default: Date.now }
}), 'teamsCurrent');
// ROUTES -------------------------------------------------



// INPUTS load
app.get('/api/input', asyncHandler(async (req, res) => {

  const data = await InputModel.findOne();
  res.json(data ? data.values : null);

}));
// INPUTS save
app.post('/api/input', asyncHandler(async (req, res) => {
  const updateData = {
    values: req.body,
    lastUpdated: new Date()
  };
  await InputModel.findOneAndUpdate({}, updateData, { upsert: true, new: true });
  res.status(200).json({ message: "Успешно сохранено в Atlas" });
}));

const rowIsUnique = (newRow, allRows) => {
  return allRows.every((row) => {
    // verify row
    const rowsEqual = row.every((v, i) => v === newRow[i]);
    return !rowsEqual;
  })
}

// NEW CALC ------------------------------------------
const calculate = (data) => {



  // calc probability ranges
  const probabilities = [];
  for (let r = 0; r < 13; r++) {


    // calc sums
    let nums_sum = 0;
    for (let c = 0; c <= 2; c++) {
      const x = data.inputs[r][c];
      if (x.state !== 0) {
        nums_sum += x.value;
      }
    }
    // build probabilities "wall"
    let acc = 0.0;
    const t = [];
    for (let c = 0; c < 2; c++) {
      const x = data.inputs[r][c];
      if (x.state !== 0) {
        acc += x.value / nums_sum;
      }
      t.push(acc);
    }
    t.push(1);
    probabilities.push(t);
  }

  // generate rows
  const allRows = [];
  const max_rows = Math.min(
    data.rowCount,
    data.inputs.map(row => row.reduce((s, a) => s + (a.state ? 1 : 0), 0)).reduce((m, a) => m * a, 1)
  );
  for (let rowIndex = 0; rowIndex < max_rows; rowIndex++) {

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
app.post('/api/output', asyncHandler(async (req, res) => {
  const data = req.body;
  const calculationResult = calculate(data);
  const updateData = {
    values: calculationResult,
    rowCount: calculationResult.length,
    requestedRows: data.rowCount,
    createdAt: new Date()
  };

  // 3. Сохраняем единственный экземпляр (upsert)
  const savedDoc = await OutputModel.findOneAndUpdate(
    {},
    updateData,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json(savedDoc);

}));



// OUTPUT load ---------------------------------------------------------------
app.get('/api/output', asyncHandler(async (req, res) => {
  const lastResult = await OutputModel.findOne().sort({ createdAt: -1 });
  res.status(200).json(lastResult ? lastResult : null);
}));
// OUTPUT delete ---------------------------------------------------------------
app.delete('/api/output', asyncHandler(async (req, res) => {
  await OutputModel.deleteMany({});
  res.status(200).json({ message: "Таблица результатов успешно очищена" });
}));

// TEAMS load/creation ---------------------------------------------------------------
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
app.get('/api/teams', asyncHandler(async (req, res) => {
  let set = await CurrentTeams.findOne().lean();

  // Если пусто — генерируем автоматически
  if (!set) {
    const newDoc = await generateAndSaveNewSet();
    set = newDoc.toObject();
  }

  const populatedMatches = await populateMatchesData(set.matches);
  res.json(populatedMatches);
}));
app.post('/api/teamsupdate', asyncHandler(async (req, res) => {
  const set = await generateAndSaveNewSet();
  const populatedMatches = await populateMatchesData(set.matches);
  res.json(populatedMatches);
}));

app.use(notFound);
app.use(errorHandler);



