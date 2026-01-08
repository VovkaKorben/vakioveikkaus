import React from "react";



const Btn = ({ onClick, caption = "Default",icon }) => {



    const handleClick = () => {
        if (onClick)
            onClick();

    };

    return (
        <button 
            className=""
            onClick={handleClick}
            
        >
            {icon && <img className="mr_small" src={`/icons/${icon}.svg`} />}
            {/* {if (icon) <img src='/icons/course.svg' />} */}
            {caption}
        </button>

    );
};

export default Btn;