import React from "react";



const Btn = ({ className, onClick, caption = "",  ...props }) => {



    const handleClick = () => {
        if (onClick)
            onClick();

    };

    return (
        <button

            onClick={handleClick}
            className={`default-btn-class ${className}`}
            {...props}
        >
            {caption}

        </button>

    );
};

export default Btn;