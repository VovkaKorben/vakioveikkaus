import React, { useState, useEffect } from 'react'
import InputBtn from './InputBtn.jsx'
import './App.css'
const API_ROUTE = 'http://localhost:3500/api/';
import { teamsDefault, defaultInput, checkDefaults, getRandomInt, numbersDefault } from './utils.js';
import { NumericFormat } from 'react-number-format';
import { prettify } from './debug.js';





const OutputTable = ({ values, onReset }) => {
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
    doSolution, // go calculate
    isCalculating,

    teams, // displayed data

    solutionRows,
    setSolutionRows,


}) => {

    // button "show numbers" load / save
    const [showNumbers, setShowNumbers] = useState(() => {
        return localStorage.getItem('showNumbers') === 'true';
    });
    useEffect(() => {
        localStorage.setItem('showNumbers', showNumbers);
    }, [showNumbers]);

    const sums = values.map(row => row.map(i => i.value).reduce((partialSum, a) => partialSum + a, 0));
    const allow_solution = values.every((v) => v.some((e) => e.state));

    return (

        <div className="card-wrapper">
            <div className="nav-tabs-container">
                Rivimäärä



                <NumericFormat
                    className="input-tab"
                    value={solutionRows}
                    onValueChange={v => setSolutionRows(v.floatValue ?? 0)}

                    decimalScale={0}            // Запрещает ввод десятичных знаков (только целые)
                    allowNegative={false}       // Запрещает ввод знака минус
                    isAllowed={(values) => {    // Валидация диапазона 0-100
                        const { floatValue } = values;
                        // Разрешаем пустое поле (undefined) или число в диапазоне
                        return floatValue === undefined || (floatValue > 0 && floatValue <= 5000);
                    }}
                />



                <button
                    className='btn-tab'
                    onClick={doSolution}
                    disabled={isCalculating || !allow_solution}
                >Ratkaisu</button>
                <button className={`btn-tab ${showNumbers ? 'btn-tab--active' : ''}`} onClick={() => setShowNumbers(prev => !prev)}>%</button>
            </div>
            {/* each 13 rows */}
            {values.map((v, rowIndex) =>
                <div
                    key={rowIndex}
                    className={`match-row ${v.some(a => a.state) ? 'match-row--active' : ''}`}
                >
                    <div className="match-number-badge">{rowIndex + 1}</div>
                    <div className="match-teams">{teams[rowIndex][0]} - {teams[rowIndex][1]}</div>
                    {/* input nums sum */}
                    {sums[rowIndex] !== 100 && <span className='sum-error'>{sums[rowIndex]}</span>}

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
    )
}



function App() {
    const [isInputLoaded, setIsInputLoaded] = useState(false);
    const [inputs, setInputs] = useState(defaultInput);
    const [output, setOutput] = useState(null);
    const [teams, setTeams] = useState(teamsDefault);
    const [isCalculating, setIsCalculating] = useState(false);
    const [solutionRows, setSolutionRows] = useState(() => {
        return localStorage.getItem('solutionRows') || 128;
    });
    useEffect(() => {
        localStorage.setItem('solutionRows', solutionRows);
    }, [solutionRows]);
    // LOAD INPUT / RESULT / TEAMS FROM DB -------------------------------------
    useEffect(() => {
        fetch(`${API_ROUTE}input`)
            .then(res => res.json())
            .then(data => {
                const verified = checkDefaults(defaultInput, data);
                setInputs(verified);
                setIsInputLoaded(true);
            })
            .catch(err => console.error("inputs load error:", err));

        fetch(`${API_ROUTE}output`)
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
    // SAVE INPUTS -------------------------------------
    useEffect(() => {
        if (!isInputLoaded) return;
        // console.log(prettify(inputs, 1));
        const timeoutId = setTimeout(async () => {
            try {
                await fetch(`${API_ROUTE}input`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(inputs) // Отправляем всю пачку rows
                });
            } catch (err) { console.error("inputs save error:", err); }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [inputs, isInputLoaded]);


    const doSolution = async () => {
        setIsCalculating(true)
        try {


            const response = await fetch(`${API_ROUTE}solution`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inputs: inputs,
                    rowCount: solutionRows
                })
            });

            const data = await response.json();

            if (Array.isArray(data)) {
                setOutput(data);
            } else {
                setOutput(null);
            }

        } catch (err) {
            console.error("doSolution error:", err);
        } finally {
            setIsCalculating(false)
        }
    }
    const handleClearButtons = () => {
        setInputs(prev =>
            prev.map(row =>
                row.map((col) => ({ ...col, state: false }))
            )
        );
    }
    const handleRandomButtons = () => {
        setInputs(prev =>
            prev.map(row =>
                row.map((col) => ({ ...col, state: Math.random() > 0.5 }))
            )
        );
    }

    const handleTeams = () => {

    }
    const handleRandomNumbers = () => {
        setInputs(prev =>
            prev.map(row => {
                let v = Array.from({ length: 3 }, () => Math.random());
                const s = v.reduce((a, b) => a + b, 0);
                // Считаем первые два числа
                const val1 = Math.round((v[0] / s) * 100);
                const val2 = Math.round((v[1] / s) * 100);
                // Третье число — это остаток, чтобы в сумме было строго 100
                const val3 = 100 - (val1 + val2);

                const finalV = [val1, val2, val3];

                return row.map((col, colIndex) => ({ ...col, value: finalV[colIndex] }));
            }
            )
        );
    }
    const handleDefaultNumbers = () => {
        setInputs(prev =>
            prev.map((row, rowIndex) =>
                row.map((col, colIndex) => ({ ...col, value: numbersDefault[rowIndex][colIndex] }))
            )
        );
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
                isCalculating={isCalculating}
                teams={teams}
                solutionRows={solutionRows}
                setSolutionRows={setSolutionRows}
                doSolution={doSolution}
            />
            : 'Loading...'}

        {/* control panel */}
        <div className="card-wrapper" style={{ marginTop: '10px' }} >
            <div className="nav-tabs-container" style={{
                borderBottom: 'none',
                paddingBottom: 0,
                marginBottom: 0
            }}>
                <button className="btn-tab" onClick={handleClearButtons}>Tyhjennä valinta</button>
                <button className="btn-tab" onClick={handleRandomButtons}>Satunnainen valinta</button>
                <button className="btn-tab" onClick={handleTeams}>Satunnaiset joukkueet</button>
                <button className="btn-tab" onClick={handleRandomNumbers}>Satunnaiset kertoimet</button>
                <button className="btn-tab" onClick={handleDefaultNumbers}>Oletuskertoimet</button>
            </div>
        </div>


        {output && <OutputTable
            values={output}
        //  onReset={doOutputClear}
        />}
    </>)
}

export default App
