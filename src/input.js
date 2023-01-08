let formulaInputBox = document.querySelector(".math-input");
let textInputBox = document.querySelector(".text-input");
let textInputArea = document.querySelector(".text-input-area");
let blackBG = document.querySelector("#black-bg");

const mqConfig = {
    supSubsRequireOperand: true,
    maxDepth: 4,
    autoOperatorNames:availibleMathFunc.join(" "),
    handlers: {
        enter() {
        },
    },
};
const formulaInputField = MQ.MathField(document.querySelector("#mq-math-field"), mqConfig);
const mathInputField = MQ.MathField(document.querySelector("#mq-text-field"), mqConfig);

function _prepareInput(inputBox) {
    document.querySelectorAll(".dropdown-menu.show").forEach((el)=>el.classList.remove("show"));
    inputBox.style.display = "flex";
    blackBG.style.display = "block";
    state.disable = true;
}

function _showIncorrect(inputBox) {
    inputBox.querySelector("small").style.display = "block";
}

function _removeInput(inputBox) {
    inputBox.style.display = "none";
    blackBG.style.display = "none";
    state.disable = false;
    inputBox.querySelector("small").style.display = "none";
}

function _getFormulaInput() {
    return new Promise((resolve, reject) => {
        document.querySelector(".formula-ready").addEventListener("click", function(e) {
            resolve(formulaInputField.latex());
        });
    });
}

async function formulaInput(defaultTeX="") {
    _prepareInput(formulaInputBox);
    formulaInputField.latex(defaultTeX);
    formulaInputField.focus();
    let formula = null;
    while (!formula) {
        let userInput = await _getFormulaInput();
        try {
            formula = formulaFromTeX(userInput);
        } catch (error) {
            _showIncorrect(formulaInputBox);
        }
    }
    formulaInputField.latex("");
    _removeInput(formulaInputBox);

    return formula;
}


function _getTextInput() {
    return new Promise((resolve, reject) => {
        document.querySelector(".text-ready").addEventListener("click", function(e) {
            resolve(textInputArea.value);
        });
    });
}

async function textInput(defaultTeX="") {
    _prepareInput(textInputBox);
    textInputArea.value = defaultTeX;
    textInputArea.focus();

    let text = await _getTextInput();
    while (!checkText(text)) {
        _showIncorrect(textInputBox);
        text = await _getTextInput();
    }
    _removeInput(textInputBox);
    textInputArea.value = "";

    return text;
}

