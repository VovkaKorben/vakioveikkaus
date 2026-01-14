export const checkDefaults = (template, target) => {
    // 1. Если типы не совпадают или данных нет — возвращаем шаблон
    if (typeof template !== typeof target || target === null || target === undefined) {
        return template;
    }

    // 2. Если это массив (например, rows, edits или buttons)
    if (Array.isArray(template)) {
        if (!Array.isArray(target)) return template;

        // Создаем массив нужной длины по шаблону и проверяем каждый элемент
        return template.map((defaultValue, index) =>
            checkDefaults(defaultValue, target[index])
        );
    }

    // 3. Если это объект (например, одна строка игры)
    if (typeof template === 'object') {
        const validatedObject = {};
        for (const key in template) {
            // Рекурсивно проверяем каждое свойство (state, edits, buttons)
            validatedObject[key] = checkDefaults(template[key], target[key]);
        }
        return validatedObject;
    }

    // 4. Если это примитив (число 0 или 1), возвращаем само значение
    return target;
};
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const valuesDefault = Array.from({ length: 13 }, () => (
    Array.from({ length: 3 }, () => (
        { state: true, value: 0 }
    ))
));