const inputFieldSpan = document.querySelector("#input-field");
const latexSpan = document.querySelector("#latex");
const interactiveConternt = document.querySelector("#interactive");

const interactiveField = new InteractiveField(interactiveConternt);

const inputField = MQ.MathField(inputFieldSpan, {
    supSubsRequireOperand: true,
    maxDepth: 4,
    handlers: {
        edit: function() {
            latexSpan.innerText = inputField.latex();
        },
        enter: function() {
            inputField.blur();
        },
    },
});

inputFieldSpan.addEventListener("focusout", ()=>{
    interactiveField.insertFormula(inputField.latex());
    inputField.latex("");
});

document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.altKey && Object.keys(interactiveFieldFunctions).includes(event.key)) {
        interactiveField[interactiveFieldFunctions[event.key]]();
    }
});
