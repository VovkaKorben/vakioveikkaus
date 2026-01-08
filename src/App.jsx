import { useState, useEffect } from 'react'
import TextInput from './TextInput.jsx'
import Btn from './Btn.jsx'
import './App.css'
const API_ROUTE = 'http://localhost:3500/api/game';
const rowsDefault = Array.from({ length: 13 }, () => ({
  state: 0,
  edits: [0, 0, 0],
  buttons: [0, 0, 0]
}));
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
const InputTable = ({ rows, rowsChanged }) => {


  const triggerState = (row_index) => {
    rowsChanged(
      rows.map((v, i) => {
        return i === row_index ? { ...v, state: v.state ^ 1 } : v;
      })
    )
  }

  return (<table className='chance-table'>
    <thead>
      <tr key='header'>
        <th>#</th>
        <th>Teams</th>
        <th>1</th>
        <th>X</th>
        <th>2</th>
        <th></th>
        <th></th>
      </tr></thead>
    <tbody>
      {rows.map((v, x) =>
        <tr key={x} className={v.state ? 'row-edit' : 'row-button'}>
          <td>{x + 1}</td>
          <td>team*team</td>




          {[0, 1, 2].map((i) => (
            <td key={i}>
              <label for="cowbell">Cowbell</label>
              <input
                type="range"
                id="cowbell"
                name="cowbell"
                min="0"
                max="100"
                value="90"
                step="10" />

            </td>
          ))}


          <td><Btn
            caption={v.state ? 'Buttons' : 'Inputs'}
            onClick={() => triggerState(x)}
            className="mode-button"
          /></td>
          <td></td>
        </tr>)}
    </tbody></table>
  )
}



function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [rows, setRows] = useState(rowsDefault);

  // LOAD CHANCES FROM DB -------------------------------------
  useEffect(() => {
    fetch(API_ROUTE)
      .then(res => res.json())
      .then(data => {
        const verified = checkDefaults(rowsDefault, data.rows);
        setRows(verified);
        setIsLoaded(true);
      })
      .catch(err => console.error("Ошибка загрузки:", err));
  }, []);

  // SAVE CHANCES TO DB -------------------------------------
  useEffect(() => {
    if (!isLoaded) return;
    const saveRows = async () => {
      try {
        await fetch(API_ROUTE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows }) // Отправляем всю пачку rows
        });
        console.log("Хозяин, всё сохранено!");
      } catch (err) {
        console.error("Ошибка сохранения:", err);
      }
    };
    saveRows();
  }, [rows, isLoaded]);


  const handleRowsChanged = (value) => {
    setRows(value);
  }





  return (

    isLoaded
      ? <InputTable rows={rows} rowsChanged={handleRowsChanged} />
      : 'Loading...'


  )
}

export default App
