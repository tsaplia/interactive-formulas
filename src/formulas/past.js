interactiveField.addEventListener("click", (event) => {
    if (event.target == interactiveField) {
        deleteActiveAll();
    }
});

// for focus state
document.querySelector("#focus-btn").addEventListener("click", ()=>{
    if (state!=states.formula || activeFormulas.length !=1 || !(activeFormulas[0].main instanceof Block)) return;
    state = states.formulaFocus;
    focusFormulaConfig = {
        path: activeFormulas[0],
        handlers: [],
    };
    deleteActive(activeFormulas[0].main);
    formulaHandler(new Formula([focusFormulaConfig.path.main]), focusFormulaConfig.path.HTML);
    prepareTerms(focusFormulaConfig.path.HTML, focusFormulaConfig.path.main);
});

interactiveField.addEventListener("click", (event) => {
    if (state == states.formulaFocus && event.target == interactiveField) {
        deleteActiveAll();
        state = states.none;
        for (let handler of focusFormulaConfig.handlers) {
            handler.target.removeEventListener("click", handler.func);
        }
        deleteTermGroups(focusFormulaConfig.path.HTML);
        focusFormulaConfig = null;
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
        if (![states.formula, states.formulaFocus].includes(state) || !action.check()) return;
        insertFormula(await action.caller());
        deleteActiveAll();
    });
}
