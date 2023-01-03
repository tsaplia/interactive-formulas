interactiveField.addEventListener("click", (event) => {
    if (state==state.DIS) return;
    if (event.target == interactiveField) {
        deleteActiveAll();
    }
});

document.querySelector(".insert-formula-btn").addEventListener("click", async ()=>{
    if (state==state.DIS) return;
    insertFormula(await formulaInput());
});

document.querySelector(".insert-text-btn").addEventListener("click", async ()=>{
    if (state==state.DIS) return;
    insertText(await textInput());
});


document.querySelector(".insert-math-btn").addEventListener("click", ()=>{
    if (mathInputField.latex()) {
        textInputArea.value += ` $${mathInputField.latex()}$ `;
        mathInputField.latex("");
        textInputArea.focus();
    }
});

for (let action of formulaActions) {
    document.querySelector(`#${action.buttonId}`).addEventListener("click", async ()=>{
        if (state!=state.FORMULA || !action.check()) return;
        action.caller();
    });
}

document.querySelectorAll("input[name='new-part-mod']").forEach((elem) => {
    if (state==state.DIS) return;
    elem.addEventListener("click", ()=>newPartMode = elem.value-"0");
});
