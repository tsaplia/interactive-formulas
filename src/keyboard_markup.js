let mainKeyboard = [
    [
        {
            width: 4,
            keys: [
                {
                    label: "7",
                },
                {
                    label: "8",
                },
                {
                    label: "9",
                },
                {
                    label: "+",
                },
            ],
        },
        {
            width: 2,
            keys: [
                {
                    label: "(",
                },
                {
                    label: ")",
                },
            ],
        },
        {
            width: 3,
            keys: [
                {
                    cmd: "sin (",
                    label: "sin",
                },
                {
                    cmd: "arcsin (",
                    label: "arcsin",
                },
                {
                    cmd: "\\alpha",
                },
            ],
        },

    ],
    [
        {
            width: 4,
            keys: [
                {
                    label: "4",
                },
                {
                    label: "5",
                },
                {
                    label: "6",
                },
                {
                    label: "-",
                },
            ],
        },
        {
            width: 2,
            keys: [
                {
                    write: "\\frac{}{}",
                    latex: "\\frac{a}{b}",
                },
                {
                    cmd: "_",
                    latex: "a_b",
                },
            ],
        },
        {
            width: 3,
            keys: [
                {
                    cmd: "cos (",
                    label: "cos",
                },
                {
                    cmd: "arccos (",
                    label: "arccos",
                },
                {
                    cmd: "\\beta",
                },
            ],
        },

    ], [
        {
            width: 4,
            keys: [
                {
                    label: "1",
                },
                {
                    label: "2",
                },
                {
                    label: "3",
                },
                {
                    label: "×",
                    cmd: "*",
                },
            ],
        },
        {
            width: 2,
            keys: [
                {
                    write: "^{2}",
                    latex: "a^2",
                },
                {
                    cmd: "^",
                    latex: "a^b",
                },
            ],
        },
        {
            width: 3,
            keys: [
                {
                    cmd: "tan (",
                    label: "tan",
                },
                {
                    cmd: "arctan (",
                    label: "arctan",
                },
                {
                    cmd: "\\theta",
                    label: "θ",
                },
            ],
        },

    ], [
        {
            width: 4,
            keys: [
                {
                    label: "0",
                },
                {
                    label: ".",
                },
                {
                    label: "=",
                },
                {
                    label: "÷",
                    cmd: "/",
                },
            ],
        },
        {
            width: 2,
            keys: [
                {
                    cmd: "\\sqrt",
                    latex: "\\sqrt{}",
                },
                {
                    write: "\\sqrt[]{}",
                    latex: "\\sqrt[n]{}",
                },
            ],
        },
        {
            width: 3,
            keys: [
                {
                    cmd: "cot (",
                    label: "cot",
                },
                {
                    cmd: "\\pi",
                },
                {
                    keystroke: "Backspace",
                    label: "⇦",
                },
            ],
        },
    ],
];

let greekKeyboard = [
    [
        {
            width: 10,
            keys: [
                {
                    label: "1",
                },
                {
                    label: "2",
                },
                {
                    label: "3",
                },
                {
                    label: "4",
                },
                {
                    label: "5",
                },
                {
                    label: "6",
                },
                {
                    label: "7",
                },
                {
                    label: "8",
                },
                {
                    label: "9",
                },
                {
                    label: "0",
                },
            ],
        },
    ],
    [
        {
            width: 10,
            keys: [
                {
                    label: "+",
                },
                {
                    label: "-",
                },
                {
                    cmd: "\\epsilon",
                    onShift: "E",
                },
                {
                    cmd: "\\rho",
                    onShift: "P",
                },
                {
                    cmd: "\\tau",
                    onShift: "T",
                },
                {
                    cmd: "\\upsilon",
                    onShift: "\\Upsilon",
                },
                {
                    cmd: "\\theta",
                    onShift: "\\Theta",
                },
                {
                    cmd: "\\iota",
                    onShift: "I",
                },
                {
                    cmd: "o",
                    onShift: "O",
                },
                {
                    cmd: "\\pi",
                    onShift: "\\Pi",
                },
            ],
        },
    ],
    [
        {
            width: 10,
            keys: [
                {
                    cmd: "\\alpha",
                    onShift: "A",
                },
                {
                    cmd: "\\sigma",
                    onShift: "\\Sigma",
                },
                {
                    cmd: "\\delta",
                    onShift: "\\Delta",
                },
                {
                    cmd: "\\phi",
                    onShift: "\\Phi",
                },
                {
                    cmd: "\\gamma",
                    onShift: "\\Gamma",
                },
                {
                    cmd: "\\eta",
                    onShift: "H",
                },
                {
                    cmd: "\\xi",
                    onShift: "\\Xi",
                },
                {
                    cmd: "\\kappa",
                    onShift: "K",
                },
                {
                    cmd: "\\lambda",
                    onShift: "\\Lambda",
                },
                {
                    label: "<big>⇪</big>",
                    shift: true,
                },
            ],
        },
    ],
    [
        {
            width: 10,
            keys: [
                {
                    cmd: "\\zeta",
                    onShift: "Z",
                },
                {
                    cmd: "\\chi",
                    onShift: "X",
                },
                {
                    cmd: "\\psi",
                    onShift: "\\Psi",
                },
                {
                    cmd: "\\omega",
                    onShift: "\\Omega",
                },
                {
                    cmd: "\\beta",
                    onShift: "B",
                },
                {
                    cmd: "\\nu",
                    onShift: "N",
                },
                {
                    cmd: "\\mu",
                    onShift: "M",
                },
                {
                    keystroke: "Shift-Left",
                    label: "←",
                },
                {
                    label: "→",
                    keystroke: "Shift-Right",
                },
                {
                    keystroke: "Backspace",
                    label: "⇦",
                },
            ],
        },
    ],
];

let latinKeyboard = [
    [
        {
            width: 10,
            keys: [
                {
                    label: "1",
                },
                {
                    label: "2",
                },
                {
                    label: "3",
                },
                {
                    label: "4",
                },
                {
                    label: "5",
                },
                {
                    label: "6",
                },
                {
                    label: "7",
                },
                {
                    label: "8",
                },
                {
                    label: "9",
                },
                {
                    label: "0",
                },
            ],
        },
    ],
    [
        {
            width: 10,
            keys: [
                {
                    cmd: "q",
                    onShift: "Q",
                },
                {
                    cmd: "w",
                    onShift: "W",
                },
                {
                    cmd: "e",
                    onShift: "E",
                },
                {
                    cmd: "r",
                    onShift: "R",
                },
                {
                    cmd: "t",
                    onShift: "T",
                },
                {
                    cmd: "y",
                    onShift: "Y",
                },
                {
                    cmd: "u",
                    onShift: "U",
                },
                {
                    cmd: "i",
                    onShift: "I",
                },
                {
                    cmd: "o",
                    onShift: "O",
                },
                {
                    cmd: "p",
                    onShift: "P",
                },
            ],
        },
    ],
    [
        {
            width: 10,
            keys: [
                {
                    cmd: "a",
                    onShift: "A",
                },
                {
                    cmd: "s",
                    onShift: "S",
                },
                {
                    cmd: "d",
                    onShift: "D",
                },
                {
                    cmd: "f",
                    onShift: "F",
                },
                {
                    cmd: "g",
                    onShift: "G",
                },
                {
                    cmd: "h",
                    onShift: "H",
                },
                {
                    cmd: "j",
                    onShift: "J",
                },
                {
                    cmd: "k",
                    onShift: "K",
                },
                {
                    cmd: "l",
                    onShift: "L",
                },
                {
                    label: "<big>⇪</big>",
                    shift: true,
                },
            ],
        },
    ],
    [
        {
            width: 10,
            keys: [
                {
                    cmd: "z",
                    onShift: "Z",
                },
                {
                    cmd: "x",
                    onShift: "X",
                },
                {
                    cmd: "c",
                    onShift: "C",
                },
                {
                    cmd: "v",
                    onShift: "V",
                },
                {
                    cmd: "b",
                    onShift: "B",
                },
                {
                    cmd: "n",
                    onShift: "N",
                },
                {
                    cmd: "m",
                    onShift: "M",
                },
                {
                    keystroke: "Shift-Left",
                    label: "←",
                },
                {
                    label: "→",
                    keystroke: "Shift-Right",
                },
                {
                    keystroke: "Backspace",
                    label: "⇦",
                },
            ],
        },
    ],
];

