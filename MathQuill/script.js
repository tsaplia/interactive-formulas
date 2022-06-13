const inputFieldSpan = document.getElementById('input-field');
const latexSpan = document.getElementById('latex');
const interactiveConternt = document.getElementById("interactive")

const interactiveField = new InteractiveField(interactiveConternt);

const inputField = MQ.MathField(inputFieldSpan, {
    supSubsRequireOperand: true,
    maxDepth: 4,
    handlers: {
        edit: function() {
            latexSpan.innerText = inputField.latex();
        },
        enter: function(){
            inputField.blur();
        }
    }
});

inputFieldSpan.addEventListener("focusout", ()=>{
    let formula = createFormula(inputField.latex());
    interactiveField.insertContent(formula);
    
    inputField.latex("");
});

function createFormula(latex){
    let elem = document.createElement("div");
    elem.className = "formula"
    elem.innerText = latex;

    MQ.StaticMath(elem);
    return elem;
}

function InteractiveField(elem){
    this.main  = elem;

    this.insertContent = function(content){
        this.main.append(content);
    }
}