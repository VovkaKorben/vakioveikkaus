import React, { useState, useEffect } from 'react'
import InputBtn from './InputBtn.jsx'
import './App.css'
const API_ROUTE = 'http://localhost:3500/api/';
import { valuesDefault, checkDefaults, getRandomInt } from './utils.js';
/* data format:
item:{state:bool,value:int}
row: item*3
set: row*13
*/
const teamsDefault = Array.from({ length: 13 }, () => (['Team 1 name', 'Team 2 name']));


const numbersDefault = [
    [17, 15, 68],
    [81, 11, 8],
    [55, 25, 21],
    [44, 32, 25],
    [67, 19, 13],
    [35, 30, 35],
    [42, 28, 29],
    [53, 25, 22],
    [58, 23, 19],
    [42, 29, 29],
    [27, 24, 49],
    [32, 28, 40],
    [65, 18, 17]
];




const ResultTable = ({ values, onReset }) => {
    const values_convert = '1X2';
    const colHeaders = Array.from({ length: 13 }, (_, i) => i + 1);


    return (
        <div className="results-section">
            <div className="nav-tabs-container ">
                <button className="btn-tab" onClick={onReset}>Tyhjennä tulokset</button>
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

const InputTable = ({
    values, // displayed data
    onChanged, // data changed (button toggle or num value)
    onCalculate, // go calculate
    isCalculating,

    teams, // displayed data

    // numbers, resetNumbers, randomizeNumbers
}) => {

    const [solutionRows, setSolutionRows] = useState(128);
    const [showNumbers, setShowNumbers] = useState(false);

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
                                <InputBtn
                                    key={`r${rowIndex}_c${colIndex}`}
                                    inputVisible={showNumbers}
                                    caption={char}
                                    data={values[rowIndex][colIndex]}
                                    onChanged={(data) => onChanged(rowIndex, colIndex, data)}
                                />


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
    const [isCalculating, setIsCalculating] = useState(false);

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
    const handleCalculate = async (ResetFlag) => {
        //  doCalc(mode ? null : inputs)

        setIsOutputCalculating(true)
        // await new Promise(resolve => setTimeout(resolve, 3000));
        try {
            const req_data = ResetFlag ? {} :
                {
                    inputs: inputs,
                    numbers: numbers
                }

            const response = await fetch(`${API_ROUTE}calc2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(req_data)
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
    const randomizeNumbers = async () => {
        try {
            const response = await fetch(`${API_ROUTE}numberscreate`);
            const data = await response.json();
            setNumbers(data);
        } catch (err) {
            console.error("randomizeNumbers generate error:", err);
        }
    }
    const resetNumbers = async () => {
        try {
            await fetch(`${API_ROUTE}numbersreset`, { method: 'POST' });
            setNumbers(numbersDefault);
        } catch (err) {
            console.error("resetNumbers generate error:", err);
        }
    }

    const onInputChange = (rowIndex, colIndex, newData) => {
        setInputs(prev => prev.map((row, ri) => ri !== rowIndex ? row :
            row.map((oldData, ci) => ci !== colIndex ? oldData : newData)
        ))
    }



    return (<>



        {isInputLoaded
            ? <InputTable
                values={inputs}
                onChanged={onInputChange}
                onCalculate={(data, rows) => handleCalculate(0)}
                isCalculating={isCalculating}
                teams={teams}
            />
            : 'Loading...'}

        {/* control panel */}
        <div className="betting-container">
            <div className="card-wrapper">
                <div className="nav-tabs-container">
                <button className="btn-tab" onClick={handleRandom}></button>
                </div>
            </div>
        </div>


        {output && <ResultTable
            values={output}
            onReset={() => handleCalculate(1)}
        />}
    </>)
}

export default App
