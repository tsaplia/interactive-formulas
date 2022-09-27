const renderButton = document.getElementById("render-button");
const inputField = document.getElementById("input-field");
const outputField = document.getElementById("output-field");
const statusField = document.getElementById("status");

renderButton.addEventListener("click", () => {
    outputField.innerHTML = "$$"+inputField.value+"$$";
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,outputField], [addListeners]);
});

function addListeners(mes){
    console.log(mes);
}

function getStructure(elem){
    for(struct in structuresNames){
        if(elem.className.includes(struct))
            return structuresNames[struct];
    }
}

