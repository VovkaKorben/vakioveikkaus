import React from "react";
import { NumericFormat } from 'react-number-format';
import './assets/css/inputbtn.css'

const InputBtn = ({
    // states
    data, // number in edit
    caption, // button text if edit hidden
    inputVisible, // show if input visible
    // events    
    onEditChanged,// numeric value changed or button toggled
    onButtonToggle

}) => {

    const handleEditChanged = (values) => {
        const newData = {
            ...data,
            // Если поле пустое, floatValue будет undefined, поэтому ставим 0
            value: values.floatValue ?? 0
        };
        if (onEditChanged)
            onEditChanged(newData);
    }
    const handleButtonToggle = () => {
        if (onButtonToggle)
            onButtonToggle();
    }

    return (
        <div
            className={`
                input-group 
                btn-state-${data.state}
                
                ${inputVisible ? "" : "input-group--hidden-input"}
                
                `}
        >

            <NumericFormat
                className="input-group__input"
                value={data.value}
                // onChange={onEditChanged} 
                onValueChange={handleEditChanged}

                decimalScale={0}            // Запрещает ввод десятичных знаков (только целые)
                allowNegative={false}       // Запрещает ввод знака минус
                isAllowed={(values) => {    // Валидация диапазона 0-100
                    const { floatValue } = values;
                    // Разрешаем пустое поле (undefined) или число в диапазоне
                    return floatValue === undefined || (floatValue > 0 && floatValue <= 100);
                }}
            />
            <button
                className="input-group__btn"
                onClick={handleButtonToggle} >
                {!inputVisible && caption}
            </button>



        </div >
    );
};

export default InputBtn;