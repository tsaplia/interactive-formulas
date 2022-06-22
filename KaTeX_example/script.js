const renderButton = document.getElementById("render-button");
const inputField = document.getElementById("input-field");
const outputField = document.getElementById("output-field");
const statusField = document.getElementById("status");

renderButton.addEventListener("click", () => {
    katex.render(inputField.value, outputField,{
        displayMode: true,
        throwOnError: false,
        output: "html"
    });

    for(let elem of document.querySelectorAll( ".mbin, .mfrac, .mord, .mrel")){
        elem.addEventListener("mouseenter", (event)=>{
            structure = getStructure(elem);
            statusField.innerText = structure;
            elem.style.borderStyle = "solid";
            
            //event.stopPropagation();
        });
        elem.addEventListener("mouseout", ()=>{
            elem.style.borderStyle = "none";
        });
    }
});

let structuresNames = {
    "sqrt": "корень",
    "mfrac": "дробь",
    "mrel": "равно",
    "mbin": "знак",
    "mord": "выражение",
};

function getStructure(elem){
    for(struct in structuresNames){
        if(elem.className.includes(struct))
            return structuresNames[struct];
    }
}

