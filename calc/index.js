
const calc_new = ({ row, colIndex, newValue }) => {
    const [idx0, idx1] = colIndex === 0 ? [1, 2] : (colIndex === 1 ? [0, 2] : [0, 1]);

    const newVal = parseInt(newValue);
    const delta = row[colIndex] - newVal;
    if (row[colIndex] === 100) {

        // if modified was 100, other must be zeroes
        row[idx0] = Math.round(delta / 2);
        row[idx1] = delta - row[idx0];
    } else {
        row[idx0] = Math.round(row[idx0] + delta * row[idx0] / (100 - row[colIndex]));
        row[idx1] = 100 - newVal - row[idx0];
    }
    row[colIndex] = newVal;
    return row;
}

const EPSILON = 0.000001; // или Number.EPSILON
const isGreaterOrEqual = (a, b) => a > b - EPSILON;
const isLessOrEqual = (a, b) => a < b + EPSILON;
const RangeCoeff = (v, s, e) => (v - s) / (e - s);
const RangeValue = (k, s, e) => (e - s) * k + s;
const ClampByte = (v) => Math.round(Math.min(Math.max(v, 0), 255));

const getBGcolor = (v) => {
    const colors = [
        { 'value': 0xFF0000, 'pos': 0.0 },
        { 'value': 0x00FF00, 'pos': 30.0 },
        { 'value': 0x00FF00, 'pos': 70.0 },
        { 'value': 0xFFFF00, 'pos': 100.0 }
    ]
    let cri;
    for (let x = 0; x < colors.length - 1; x++) {
        if (isLessOrEqual(colors[x].pos, v) && isGreaterOrEqual(colors[x + 1].pos, v)) {
            cri = x;
            break;
        }
    }
    const k = RangeCoeff(v, colors[cri].pos, colors[cri + 1].pos);

    const r1 = (colors[cri].value >> 16) & 0xFF;
    const g1 = (colors[cri].value >> 8) & 0xFF;
    const b1 = colors[cri].value & 0xFF;
    const r2 = (colors[cri + 1].value >> 16) & 0xFF;
    const g2 = (colors[cri + 1].value >> 8) & 0xFF;
    const b2 = colors[cri + 1].value & 0xFF;

    const r3 = RangeValue(k, r1, r2);
    const g3 = RangeValue(k, g1, g2);
    const b3 = RangeValue(k, b1, b2);

    const color_value = (ClampByte(r3) << 16) | (ClampByte(g3) << 8) | ClampByte(b3);
    return '#' + color_value.toString(16).padStart(6, '0');
}


for (let x = 0; x <= 100; x += 2)
    console.log(x, getBGcolor(x));
    // getBGcolor(x);




/*
console.log(calc_new({ row: [50, 30, 20], colIndex: 0, newValue: 70 }));
console.log(calc_new({ row: [70, 20, 10], colIndex: 0, newValue: 84 }));
console.log(calc_new({ row: [100, 0, 0], colIndex: 0, newValue: 70 }));
console.log(calc_new({ row: [50, 30, 20], colIndex: 0, newValue: 100 }));
console.log(calc_new({ row: [0, 0, 100], colIndex: 0, newValue: 70 }));
console.log(calc_new({ row: [0, 0, 100], colIndex: 0, newValue: 100 }));
console.log(calc_new({ row: [0, 0, 100], colIndex: 0, newValue: 50 }));
console.log(calc_new({ row: [50, 50, 0], colIndex: 0, newValue: 20 }));
console.log(calc_new({ row: [100, 0, 0], colIndex: 0, newValue: 80 }));
console.log(calc_new({ row: [99, 1, 0], colIndex: 0, newValue: 80 })); 
console.log(calc_new({ row: [50, 25, 25], colIndex: 0, newValue: 51 }));
console.log(calc_new({ row: [99, 1, 0], colIndex: 0, newValue: 80 }));
console.log(calc_new({ row: [1, 1, 98], colIndex: 2, newValue: 99 }));
*/
