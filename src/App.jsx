import { useState, useEffect } from 'react'
import TextInput from './TextInput.jsx'
import Slider from './Slider.jsx'
import './App.css'
import { prettify } from './debug.js'
const API_ROUTE = 'http://localhost:3500/api/game';
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

const InputTable = ({ values, valuesChanged }) => {


  const handleSliderChange = (rowIndex, colIndex, newValue) => {
    const newValues = values.map((row, i) => i === rowIndex ? calcRow(row, colIndex, newValue) : row);
    valuesChanged(newValues);
  }

  const handleClear = () => {
    const newValues = values.map((row, i) => i === rowIndex ? calcRow(row, colIndex, newValue) : row);
    valuesChanged(newValues);
  }
  return (

    <div className="betting-container">
      <div className="card-wrapper">

        <div className="nav-tabs-container">
          <button className="btn-tab" onClick={handleClear}>Clear</button>
          <button className="btn-tab btn-tab">Random</button>
          <button className="btn-tab btn-tab--active">Evaluate</button>
        </div>
        {/* each 13 rows */}
        {values.map((v, rowIndex) =>

          <div key={rowIndex} className="match-row match-row--active">
            <div className="match-number-badge">{rowIndex + 1}</div>
            <div className="match-teams">Manchester C - Newcastle U</div>
            <div className="selection-group">

              {/* buttons 1 X 2 */}
              {[...'1X2'].map((char, colIndex) => (

                <button
                  key={`r${rowIndex}_c${colIndex}`}
                  className={`btn-outcome ${v[colIndex] ? 'btn-outcome--selected' : ''}`}
                  onClick={() => handleSliderChange(rowIndex, colIndex)}
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

  // LOAD CHANCES FROM DB -------------------------------------
  useEffect(() => {
    fetch(API_ROUTE)
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
        await fetch(API_ROUTE, {
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





  return (

    isLoaded
      ? <InputTable values={values} valuesChanged={handleValuesChanged} />
      : 'Loading...'



  )
}

export default App
