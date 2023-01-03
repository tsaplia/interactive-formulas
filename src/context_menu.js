function cmCopy(event) {
    if (state==state.FORMULA && selected.formulas.length == 1) {
        let TeX = selected.formulas[0].main.toTex();
        if (TeX) {
            navigator.clipboard.writeText(`$$${TeX}$$`);
        }
        event.preventDefault();
    }
    if (state==state.TEXT && selected.texts.length == 1) {
        navigator.clipboard.writeText(selected.texts[0].text);
        event.preventDefault();
    }
}

async function cmEdit() {
    if (state==state.FORMULA && selected.formulas.length==1 && selected.formulas[0].main instanceof Formula) {
        menu.classList.remove("active-cm");
        replaceFormula(await formulaInput(selected.formulas[0].main.toTex()), selected.formulas[0].HTML);
    }
    if (state==state.TEXT && selected.texts.length == 1) {
        menu.classList.remove("active-cm");
        let elem = selected.texts[0].HTML;
        insertText(await textInput(selected.texts[0].text), elem);
        deleteContent(elem);
    }
}

async function cmPaste(event) {
    if (state==state.DIS || event.target.tagName=="TEXTAREA") return;
    insertTeX(await navigator.clipboard.readText());
    event.preventDefault();
}

function cmDelete() {
    if (state==state.DIS) return;
    for (let active of selected.formulas) {
        if (active.main instanceof Formula) deleteContent(active.HTML.parentElement.parentElement);
    }
    for (let active of selected.texts) {
        deleteContent(active.HTML);
    }
}

document.addEventListener("copy", cmCopy);
document.addEventListener("paste", cmPaste);
document.querySelector("#paste-btn").addEventListener("click", cmPaste);
document.querySelector("#copy-btn").addEventListener("click", cmCopy);
document.querySelector("#edit-btn").addEventListener("click", cmEdit);
document.querySelector("#delete-btn").addEventListener("click", cmDelete);
