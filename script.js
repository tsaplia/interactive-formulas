const inputFieldSpan = document.querySelector("#input-field");
const latexSpan = document.querySelector("#latex");
const interactiveConternt = document.querySelector("#interactive");
const renderButton = document.querySelector("#render-button");

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

renderButton.addEventListener("click", ()=>{
    interactiveField.insertFormula(inputField.latex());
    inputField.blur();
    inputField.latex("");
});

document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.altKey && Object.keys(interactiveFieldFunctions).includes(event.key)) {
        interactiveField[interactiveFieldFunctions[event.key]]();
    }
});
