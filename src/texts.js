/**
 * @param {HTMLElement} elem
 * @param {string} text
 */
function textHandler(elem, text) {
    elem.addEventListener("click", (event)=>{
        if (state==state.DIS) return;
        event.stopPropagation();

        if (selected.texts.find((obj) => obj.HTML == elem)) {
            let ind = selected.texts.findIndex((obj) => obj.HTML == elem);
            setSelectedStyle(selected.texts[ind]);
            selected.texts.splice(ind, 1);
            return;
        }
        if (!event.shiftKey) {
            deleteActiveAll();
        }
        selected.texts.push({
            HTML: elem,
            text: text,
        });
        setSelectedStyle(selected.texts.slice(-1)[0]);
    });
}


/**
 * Is text correct for MathJax
 * @param {string} text
 * @return {boolean}
 */
function checkText(text) {
    if(!text) return false;
    let elem = document.createElement("div");
    elem.innerHTML = text;
    MathJax.typeset([elem]);
    return !elem.querySelector("mjx-merror");
}
