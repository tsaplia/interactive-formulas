const renderButton = document.getElementById("render-button");
const inputField = document.getElementById("input-field");
const outputField = document.getElementById("output-field");
const statusField = document.getElementById("status");

renderButton.addEventListener("click", () => {
    outputField.innerHTML = "$$"+inputField.value+"$$";
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,outputField], [addListeners]);
});

function addListeners(){
    for(let elem of document.querySelectorAll( ".mfrac, .mrow, .msqrt, .mi, .msup, .mn, .mo")){
        elem.addEventListener("mouseenter", (event)=>{
            statusField.innerText = getStructure(elem);
            elem.style.borderWidth = "medium";
            elem.style.borderStyle = "solid";
            
            event.stopPropagation();
        });
        elem.addEventListener("mouseout", ()=>{
            elem.style.borderStyle = "none";
        });
    }
}

let structuresNames = {
    "msqrt": "корень",
    "mfrac": "дробь",
    "mn": "число",
    "msup": "степень",
    "mrow": "выражение",
    "mi": "буква",
    "mo": "знак"
};

function getStructure(elem){
    for(struct in structuresNames){
        if(elem.className.includes(struct))
            return structuresNames[struct];
    }
}

