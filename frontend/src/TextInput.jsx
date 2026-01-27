import React, { useEffect, useState } from "react";



const TextInput = ({
    caption,

    onChange,


    initial = ''
}) => {
    const [value, setValue] = useState(initial);

    // useEffect(() => { setValue(initValue); }, [initValue]);

    useEffect(() => { setValue(initial); }, [initial]);

    const handleChange = (event) => {
        const newValue = event.target.value;
        setValue(newValue);
        if (onChange)
            onChange(newValue);

    };

    // console.log(`[${caption}]init_value: ${initValue}`);    console.log(`[${caption}]init_value: ${inputValue}`);
    return (
        <input type="text"
            value={value}
            onChange={handleChange}
        />




    );
};

export default TextInput;