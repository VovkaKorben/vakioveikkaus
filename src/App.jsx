import React, { useState, useEffect } from 'react'
import TextInput from './TextInput.jsx'
import Slider from './Slider.jsx'
import './App.css'
const API_ROUTE = 'http://localhost:3500/api/';
const valuesDefault = Array.from({ length: 13 }, () => ([0, 0, 0]));
const teamsDefault = Array.from({ length: 13 }, () => (['Team 1 name', 'Team 2 name']));

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
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const ResultTable = ({ values, onReset }) => {
    const values_convert = '1X2';
    const colHeaders = Array.from({ length: 13 }, (_, i) => i + 1);


    return (
        <div className="results-section">
            <div className="nav-tabs-container ">
                <button className="btn-tab" onClick={onReset}>
                    Clear Results
                </button>
            </div>

            <div className="results-list">
                {values.map((row, rowIndex) => (
                    <React.Fragment key={`group-${rowIndex}`}>
                        {/* Вставляем заголовок каждые 10 строк */}
                        {rowIndex % 10 === 0 && (
                            <div className="results-group-header">
                                <div className="header-label">
                                    {rowIndex + 1}–{Math.min(rowIndex + 10, values.length)}
                                </div>
                                <div className="header-values">
                                    {colHeaders.map(num => (
                                        <div key={`head-${num}`} className="header-num">{num}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Сама строка данных */}
                        <div className="row-plate">
                            <div className="row-label">{rowIndex + 1}</div>
                            <div className="row-values">
                                {row.map((value, colIndex) => (
                                    <div key={colIndex} className="result-cell">
                                        {values_convert[value]}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const InputTable = ({ values, onChanged, onCalculate, isCalculating, teams, handleTeams }) => {

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
        const newValues = valuesDefault.map((row) => {
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
                    >Evaluate</button>
                    <button className="btn-tab" onClick={handleTeams}>Teams</button>
                </div>
                {/* each 13 rows */}
                {values.map((v, rowIndex) =>
                    <div
                        key={rowIndex}
                        className={`match-row ${v.reduce((a, b) => a + b, 0) ? 'match-row--active' : ''}`}
                    >
                        <div className="match-number-badge">{rowIndex + 1}</div>
                        <div className="match-teams">{teams[rowIndex][0]} - {teams[rowIndex][1]}</div>
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
                        </div>
                    </div>
                )}
            </div>
        </div >
    )
}



function App() {
    const [isInputLoaded, setIsInputLoaded] = useState(false);
    const [inputs, setInputs] = useState(valuesDefault);
    const [output, setOutput] = useState(null);
    const [teams, setTeams] = useState(teamsDefault);

    const [isOutputCalculating, setIsOutputCalculating] = useState(false);

    // LOAD INPUT / RESULT / TEAMS FROM DB -------------------------------------
    useEffect(() => {
        fetch(`${API_ROUTE}game`)
            .then(res => res.json())
            .then(data => {
                const verified = checkDefaults(valuesDefault, data);
                setInputs(verified);
                setIsInputLoaded(true);
            })
            .catch(err => console.error("inputs load error:", err));

        fetch(`${API_ROUTE}result`)
            .then(res => res.json())
            .then(data => {

                setOutput(data);
            })
            .catch(err => console.error("result load error:", err));

        fetch(`${API_ROUTE}teams`)
            .then(res => res.json())
            .then(data => {
                const verified = checkDefaults(teamsDefault, data);
                setTeams(verified);

            })
            .catch(err => console.error("teams load error:", err));



    }, []);



    // SAVE CHANCES TO DB -------------------------------------
    useEffect(() => {
        if (!isInputLoaded) return;

        const timeoutId = setTimeout(async () => {
            try {
                await fetch(`${API_ROUTE}game`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values: inputs }) // Отправляем всю пачку rows
                });
                //   console.log("Хозяин, всё сохранено!");
            } catch (err) {
                console.error("Ошибка сохранения:", err);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [inputs, isInputLoaded]);


    const handleValuesChanged = (values) => {
        setInputs(values);
    }


    const handleTeams = () => {

        const doTeamsUpdate = async () => {
            try {
                const response = await fetch(`${API_ROUTE}teamsupdate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();
                setTeams(data);


            } catch (err) {
                console.error("teams generate error:", err);
            }
        }

        doTeamsUpdate();
    }


    const handleCalculate = (mode) => {

        const doCalc = async (values) => {
            setIsOutputCalculating(true)
            // await new Promise(resolve => setTimeout(resolve, 3000));
            try {
                const response = await fetch(`${API_ROUTE}calc`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values }) // Отправляем всю пачку rows
                });

                const data = await response.json();

                if (Array.isArray(data)) {
                    setOutput(data);
                } else {
                    setOutput(null);
                }

            } catch (err) {
                console.error("Ошибка сохранения:", err);
            } finally {
                setIsOutputCalculating(false)
            }
        }

        doCalc(mode ? null : inputs)
    }





    return (<>

        {isInputLoaded
            ? <InputTable
                values={inputs}
                onChanged={handleValuesChanged}
                onCalculate={() => handleCalculate(0)}
                isCalculating={isOutputCalculating}
                teams={teams}
                handleTeams={handleTeams}
            />
            : 'Loading...'}

        {output && <ResultTable
            values={output}
            onReset={() => handleCalculate(1)}
        />}
    </>)
}

export default App
