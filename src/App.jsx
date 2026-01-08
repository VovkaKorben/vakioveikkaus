import { useState, useEffect } from 'react'
import TextInput from './TextInput.jsx'
import Btn from './Btn.jsx'
import './App.css'
const InputTable = ({ rowMode, toggleRow }) => {
  const resultRows = [];
  resultRows.push(<tr key='header'>
    <th>Teams</th>
    <th>1</th>
    <th>X</th>
    <th>2</th>
    <th></th>
    <th></th>
  </tr>)
  for (let x = 0; x < 13; x++) {
    resultRows.push(<tr key={x}>
      <td>team*team</td>
      <td><TextInput /></td>
      <td><TextInput /></td>
      <td><TextInput /></td>
      <td><Btn
        caption={rowMode[x] ? '1' : '2'}
      /></td>
      <td></td>
    </tr>)
  }
  return <table className='chance-table'><tbody>{resultRows}</tbody> </table>;
}



function App() {
  const [rowMode, setRowMode] = useState(() => new Array(13).fill(0));
  const handleRowToggle = (idx) => { }


  useEffect(() => {
    console.log(`rowMode: ${rowMode}`)
  }, [rowMode]);

  return (
    <InputTable

      toggleRow={handleRowToggle} />

  )
}

export default App
