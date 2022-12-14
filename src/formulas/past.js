interactiveField.addEventListener("click", (event) => {
    if (event.target == interactiveField) {
        deleteActiveAll();
    }
});

document.addEventListener("copy", (event)=>{
    if (activeFormulas.length != 1 || state != states.formula) return;
    let TeX = activeFormulas[0].main.toTex();
    if (TeX) {
        event.clipboardData.setData("text/plain", TeX);
    }
    event.preventDefault();
});

document.querySelector(".insert-formula-btn").addEventListener("click", async ()=>{
    insertFormula(await formulaInput());
});


for (let action of formulaActions) {
    document.querySelector(`#${action.buttonId}`).addEventListener("click", async ()=>{
        if (!action.state.includes(state) || !action.check()) return;
        insertFormula(await action.caller());
        deleteActiveAll();
    });
}
