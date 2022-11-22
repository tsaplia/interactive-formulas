let insertFormulaBtn = document.querySelector(".insert-formula-btn");

interactiveField.addEventListener("click", (event) => {
    if (event.target == interactiveField) {
        deleteActiveAll();
    }
});

document.addEventListener("copy", (event)=>{
    if (activeFormulas.length != 1 || state != "formula") return;
    let TeX = activeFormulas[0].main.toTex();
    if (TeX) {
        event.clipboardData.setData("text/plain", TeX);
    }
    event.preventDefault();
});

insertFormulaBtn.addEventListener("click", async ()=>{
    insertFormula(await formulaInput());
});


for (let action of formulaActions) {
    document.querySelector(`#${action.buttonId}`).addEventListener("click", async ()=>{
        if (state!="formula" || !action.check()) return;
        insertFormula(await action.caller());
    });
}
