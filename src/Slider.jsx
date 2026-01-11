import React, { useState, useEffect } from 'react'



const Slider = ({ clr, value, id, onChange }) => {
    const handleChange = (event) => {
        if (onChange)
            onChange(event.target.value);
    };

    return (
        <div className='slider-cont'>
            <label htmlFor={id}>{value}</label>
            <input
                type="range"
                id={id}
                min="0"
                max="100"
                value={value}
                onChange={handleChange}
                step="1"
                style={{ '--thumb-color': clr }}
            />
        </div>
    );
};

export default Slider;