import { useState, useEffect } from 'react'
import TextInput from './TextInput.jsx'
import Slider from './Slider.jsx'
import './App.css'
import { prettify } from './debug.js'
const API_ROUTE = 'http://localhost:3500/api/';
const valuesDefault = Array.from({ length: 13 }, () => ([0, 0, 0]));
const checkDefaults = (template, target) => {
  // 1. Если типы не совпадают или данных нет — возвращаем шаблон
  if (typeof template !== typeof target || target === null || target === undefined) {
    return template;
  }

  // 2. Если это массив (например, rows, edits или buttons)
  if (Array.isArray(template)) {
    if (!Array.isArray(target)) return template;

    // Создаем массив нужной длины по шаблону и проверяем каждый элемент
    return template.map((defaultValue, index) =>
      checkDefaults(defaultValue, target[index])
    );
  }

  // 3. Если это объект (например, одна строка игры)
  if (typeof template === 'object') {
    const validatedObject = {};
    for (const key in template) {
      // Рекурсивно проверяем каждое свойство (state, edits, buttons)
      validatedObject[key] = checkDefaults(template[key], target[key]);
    }
    return validatedObject;
  }

  // 4. Если это примитив (число 0 или 1), возвращаем само значение
  return target;
};
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const ResultTable = ({ values }) => {
  return ('results !!!')
}

const InputTable = ({ values, onChanged, onCalculate, isCalculating }) => {

  const valuesChanged = (newValues) => {
    // calc eval button
    if (onChanged)
      onChanged(newValues);
  }

  const handleToggle = (rowIndex, colIndex) => {
    const newValues = values.map((row, ri) => {
      return ri === rowIndex ? row.map((v, ci) => ci === colIndex ? 1 - v : v) : row
    });
    valuesChanged(newValues);
  }

  const handleClear = () => {
    const newValues = [...valuesDefault];
    valuesChanged(newValues);
  }
  const handleRandom = () => {
    const newValues = valuesDefault.map((row, rowIndex) => {
      const dice = getRandomInt(1, 7);
      return row.map((v, i) => {
        return (dice >> i) & 1;
      });
    });
    valuesChanged(newValues);
  }

  return (

    <div className="betting-container">
      <div className="card-wrapper">

        <div className="nav-tabs-container">
          <button className="btn-tab" onClick={handleClear}>Clear</button>
          <button className="btn-tab" onClick={handleRandom}>Random</button>
          <button
            className="btn-tab"
            disabled={isCalculating || (!values.every((row) => row.reduce((a, b) => a + b, 0) !== 0))}
            onClick={onCalculate}
          >

            Evaluate</button>
          {prettify(isCalculating)}
        </div>
        {/* each 13 rows */}
        {values.map((v, rowIndex) =>
          <div
            key={rowIndex}
            className={`match-row ${v.reduce((a, b) => a + b, 0) ? 'match-row--active' : ''}`}
          >
            <div className="match-number-badge">{rowIndex + 1}</div>
            <div className="match-teams">Manchester C - Newcastle U</div>
            <div className="selection-group">

              {/* buttons 1 X 2 */}
              {[...'1X2'].map((char, colIndex) => (

                <button
                  key={`r${rowIndex}_c${colIndex}`}
                  className={`btn-outcome ${v[colIndex] ? 'btn-outcome--selected' : ''}`}
                  onClick={() => handleToggle(rowIndex, colIndex)}
                >
                  {char}
                </button>
              ))}


              {/* onChange={(newValue) => handleSliderChange(rowIndex, colIndex, newValue)} */}
            </div>
          </div>
        )}

      </div>
    </div >
  )
}



function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [values, setValues] = useState(valuesDefault);
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // LOAD CHANCES FROM DB -------------------------------------
  useEffect(() => {
    fetch(`${API_ROUTE}game`)
      .then(res => res.json())
      .then(data => {
        const verified = checkDefaults(valuesDefault, data);
        // const normalized = verified.map((row) => calcRow(row, 0, row[0]));
        setValues(verified);
        setIsLoaded(true);
        // console.log(`data loaded: ${prettify(verified, 0)}`);
      })
      .catch(err => console.error("Ошибка загрузки:", err));
  }, []);

  // SAVE CHANCES TO DB -------------------------------------
  useEffect(() => {
    if (!isLoaded) return;

    const timeoutId = setTimeout(async () => {
      try {
        await fetch(`${API_ROUTE}game`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values }) // Отправляем всю пачку rows
        });
        //   console.log("Хозяин, всё сохранено!");
      } catch (err) {
        console.error("Ошибка сохранения:", err);
      }
    }, 500); // Задержка 500 мс (полсекунды)
    return () => clearTimeout(timeoutId);
  }, [values, isLoaded]);


  const handleValuesChanged = (values) => {
    setValues(values);
  }

  const handleCalculate = (mode) => {

    const doCalc = async (values) => {
      setIsCalculating(true)
      // await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        await fetch(`${API_ROUTE}calc`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values }) // Отправляем всю пачку rows
        });
        //   console.log("Хозяин, всё сохранено!");
      } catch (err) {
        console.error("Ошибка сохранения:", err);
      } finally {
        setIsCalculating(false)
      }
    }

    doCalc(mode ? null : values)
  }





  return (<>

    {isLoaded
      ? <InputTable
        values={values}
        onChanged={handleValuesChanged}
        onCalculate={() => handleCalculate(0)}
        isCalculating={isCalculating}
      />
      : 'Loading...'}

    {results && <ResultTable
      values={results}
      onReset={() => handleCalculate(1)}
    />}
  </>)
}

export default App
