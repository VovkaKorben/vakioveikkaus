import React from "react";
import { NumericFormat } from 'react-number-format';
import './assets/css/inputbtn.css'

const InputBtn = ({
    // states
    data, // number in edit
    caption, // button text if edit hidden
    inputVisible, // show if input visible
    isOutlined, // show glow for
    // events    
    onChanged// numeric value changed or button toggled

}) => {

    const onEditChanged = (event) => {
        const newData = { ...data };
        newData.value = event.target.value;
        if (onChanged)
            onChanged(newData);
    }
    const onButtonToggle = () => {
        const newData = { ...data };
        newData.state = !newData.state;
        if (onChanged)
            onChanged(newData);
    }



    return (
        <div
            className={`
                input-group 
                ${data.state ? "input-group--active" : ''}
                ${inputVisible ? "" : "input-group--hidden-input"} 
                ${isOutlined ? "input-group--glow" : ""}
                `}
        >

            <NumericFormat
                className="input-group__input"
                value={data.value}
                onChanged={onEditChanged} />
            <button
                className="input-group__btn"
                onClick={onButtonToggle} >
                {!inputVisible && caption}
            </button>



        </div >
    );
};

export default InputBtn;