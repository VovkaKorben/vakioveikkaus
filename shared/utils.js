/* data format:
item:{state:bool,value:int}
row: item*3
set: row*13
*/


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
export const defaultInput = Array.from({ length: 13 }, () => (
    Array.from({ length: 3 }, () => (
        { state: 0, value: 0 }
    ))
));


export const teamsDefault = Array.from({ length: 13 }, () => (['Team 1 name', 'Team 2 name']));


export const numbersDefault = [
    [17, 15, 68],
    [81, 11, 8],
    [55, 25, 21],
    [44, 32, 25],
    [67, 19, 13],
    [35, 30, 35],
    [42, 28, 29],
    [53, 25, 22],
    [58, 23, 19],
    [42, 29, 29],
    [27, 24, 49],
    [32, 28, 40],
    [65, 18, 17]
];
