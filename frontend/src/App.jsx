import React, { useState, useEffect } from 'react'
import InputBtn from './InputBtn.jsx'
import './App.css'
import './assets/css/errors.css'
const API_ROUTE = 'http://localhost:3500/api/';
import { teamsDefault, defaultInput, checkDefaults, getRandomInt, numbersDefault } from './utils.js';
import { NumericFormat } from 'react-number-format';
import { prettify } from './debug.js';

const ErrorsShow = ({ errors }) => {
    if (!errors.length) return null;

    return (
        <div className='error-box'>
            <div className='error-icon'>!</div>
            <div className='error-content'>
                {errors.map((e, i) =>
                    <div key={`${i}`} > {e}</div>
                )}
            </div >
        </div >

    );
};
const OutputTable = ({ data, onReset }) => {
    const values_convert = '1X2';
    const colHeaders = Array.from({ length: 13 }, (_, i) => i + 1);


    return (
        <div className="results-section">
            {/* <div className="nav-tabs-container ">
               <span>{data.rowCount} { data.rowCount!==data.requestedRows && `!!!`}   </span>
                <button className="btn-tab" onClick={onReset}>Tyhjennä tulokset</button>
            </div> */}
            <div className="nav-tabs-container">
                <div className="results-stats">
                    <span>Rivit: {data.rowCount}</span>
                    <span className="results-warning">
                        {data.rowCount !== data.requestedRows && ` (Pyydetyt: ${data.requestedRows})`}
                    </span>
                </div>
                <button className="btn-tab" onClick={onReset}>Tyhjennä tulokset</button>
            </div>

            <div className="results-list">
                {data.values.map((row, rowIndex) => (
                    <React.Fragment key={`group-${rowIndex}`}>
                        {/* Вставляем заголовок каждые 10 строк */}
                        {rowIndex % 10 === 0 && (
                            <div className="results-group-header">
                                <div className="header-label">
                                    {rowIndex + 1}–{Math.min(rowIndex + 10, data.values.length)}
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
    onEditChanged, // data changed (num value)
    onButtonToggle, // data changed (button toggle)
    doOutput, // go calculate
    isCalculating,

    teams, // displayed data

    outputRows,
    setOutputRows,

    doShuffle


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
                Rivimäärä<NumericFormat
                    className="input-tab"
                    value={outputRows}
                    onValueChange={v => setOutputRows(v.floatValue ?? 0)}

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
                    onClick={doOutput}
                    disabled={isCalculating || !allow_solution}
                >Ratkaisu</button>
                <button className={`btn-tab ${showNumbers ? 'btn-tab--active' : ''}`} onClick={() => setShowNumbers(prev => !prev)}>%</button>
                <button className='btn-tab' onClick={doShuffle}>↺</button>
            </div>
            {/* each 13 rows */}
            {values.map((v, rowIndex) =>

                // row "complete" sign
                <div
                    key={rowIndex}
                    className={`match-row ${v.some(a => a.state) ? 'match-row--active' : ''}`}
                >
                    <div className="match-number-badge">{rowIndex + 1}</div>
                    <div className="match-teams">{teams[rowIndex][0]} - {teams[rowIndex][1]}</div>
                    {/* input nums sum */}
                    {sums[rowIndex] !== 100 && <span className='sum-error'>{sums[rowIndex]}</span>}
                    {/* {prettify(v, 0)} */}
                    <div className="selection-group">

                        {/* buttons 1 X 2 */}
                        {[...'1X2'].map((char, colIndex) => (

                            <InputBtn
                                key={`r${rowIndex}_c${colIndex}`}

                                inputVisible={showNumbers}
                                caption={char}
                                data={values[rowIndex][colIndex]}

                                onButtonToggle={() => onButtonToggle(rowIndex, colIndex)}
                                onEditChanged={(data) => onEditChanged(rowIndex, colIndex, data)}
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
    const [outputRows, setOutputRows] = useState(() => {
        return localStorage.getItem('outputRows') || 128;
    });
    const [errors, setErrors] = useState([]);
    const logError = (msg) => {
        console.error(msg);
        setErrors(prev => {
            const messages = [...prev];
            messages.unshift(msg);
            return messages;
        })
    }

    useEffect(() => {
        localStorage.setItem('outputRows', outputRows);
    }, [outputRows]);
    // LOAD INPUT / RESULT / TEAMS FROM DB -------------------------------------
    useEffect(() => {
        // logError('[app init] fetch started');
        fetch(`${API_ROUTE}input`)
            .then(res => res.json())
            .then(data => {
                // console.log("Raw data from DB:", prettify(data, 1))
                const verified = checkDefaults(defaultInput, data);
                setInputs(verified);
                setIsInputLoaded(true);
            })
            .catch(err => logError("inputs load error:", err));

        fetch(`${API_ROUTE}output`)
            .then(res => res.json())
            .then(data => {
                setOutput(data);
            })
            .catch(err => logError("result load error:", err));

        fetch(`${API_ROUTE}teams`)
            .then(res => res.json())
            .then(data => {
                const verified = checkDefaults(teamsDefault, data);
                setTeams(verified);

            })
            .catch(err => logError("teams load error:", err));



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


    const doOutput = async () => {
        setIsCalculating(true)
        try {


            const response = await fetch(`${API_ROUTE}output`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inputs: inputs,
                    rowCount: outputRows
                })
            });

            const data = await response.json();
            setOutput(data);
            /*if (Array.isArray(data)) {
                setOutput(data);
            } else {
                setOutput(null);
            }*/

        } catch (err) {
            logError("doSolution error:", err);
        } finally {
            setIsCalculating(false)
        }
    }
    const doOutputClear = async () => {
        try {
            await fetch(`${API_ROUTE}output`, { method: 'DELETE' });
            setOutput(null);
        } catch (err) {
            logError("doOutputClear error:", err);
        }
    }

    const handleClearButtons = () => {
        setInputs(prev =>
            prev.map(row =>
                row.map((col) => ({ ...col, state: 0 }))
            )
        );
    }
    const handleRandomButtons = () => {
        setInputs(prev =>
            prev.map(row =>
                row.map((col) => ({ ...col, state: getRandomInt(0, 1) }))
            )
        );
    }

    const handleTeams = async () => {
        try {
            const response = await fetch(`${API_ROUTE}teamsupdate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            setTeams(data);
        } catch (err) { logError("teams generate error:", err); }
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
    const doShuffle = () => {
        setInputs(prev => prev.map(row => {
            // Проверяем: если ряд абсолютно пустой (все state === 0)
            if (row.every(cell => cell.state !== 1)) {
                const colIndex = getRandomInt(0, 2);

                // Возвращаем новый массив строки, где одна ячейка — это новый объект
                return row.map((cell, idx) => { return { ...cell, state: idx === colIndex ? 2 : 0 } }
                );
            }

            
            return row;
        }));


    }

    /*  const onInputChange = (rowIndex, colIndex, newData) => {
          //setInputs(prev => prev.map((row, ri) => ri !== rowIndex ? row :            row.map((oldData, ci) => ci !== colIndex ? oldData : newData)        ))
          console.log(prettify(newData, 0));
          setInputs(prev => {
              const newRows = [...prev];
              const newRow = [...newRows[rowIndex]];
              newRows[rowIndex] = newRow.map((cell, cellColumn) => {
                  const updCell = { ...cell };
                  // чекаем, есть ли "робот" в строке
                  if (updCell.state === 2)
                      updCell.state = 0;
                  // тогглим выбраную колонку
                  if (cellColumn === colIndex)
                      updCell.state = 1 - updCell.state;
                  return updCell;
              });
              return newRows;
          });
      }*/
    const onButtonToggle = (rowIndex, colIndex) => {
        //setInputs(prev => prev.map((row, ri) => ri !== rowIndex ? row :            row.map((oldData, ci) => ci !== colIndex ? oldData : newData)        ))
        // console.log(prettify(newData, 0));
        setInputs(prev => {
            const newRows = [...prev];
            const newRow = [...newRows[rowIndex]];
            newRows[rowIndex] = newRow.map((cell, cellColumn) => {
                const updCell = { ...cell };
                // чекаем, есть ли "робот" в строке
                if (updCell.state === 2)
                    updCell.state = 0;
                // тогглим выбраную колонку
                if (cellColumn === colIndex)
                    updCell.state = 1 - updCell.state;
                return updCell;
            });
            return newRows;
        });
    }
    const onEditChanged = (rowIndex, colIndex, newData) => {
        setInputs(prev => {
            const newRows = [...prev];
            const newRow = [...newRows[rowIndex]];
            newRow[colIndex] = newData;
            newRows[rowIndex] = newRow;
            return newRows;
        });
    }


    return (<>

        {isInputLoaded
            ? <InputTable
                values={inputs}

                onEditChanged={onEditChanged}
                onButtonToggle={onButtonToggle}

                isCalculating={isCalculating}
                teams={teams}
                outputRows={outputRows}
                setOutputRows={setOutputRows}
                doOutput={doOutput}
                doShuffle={doShuffle}
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
            data={output}
            onReset={doOutputClear}
        />}

        <ErrorsShow errors={errors} />
    </>)
}

export default App
