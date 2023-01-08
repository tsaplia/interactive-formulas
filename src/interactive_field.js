
/**
 * @typedef {{main: MathStructure, HTML: HTMLElement , mult: ?MathStructure, term: ?Term, formula: ?Formula}}
 *ActiveFormula
 * Description of active formula element
 * @typedef {{HTML: HTMLElement, text:string}} ActiveText Description of active text element
 */

let interactiveField = document.querySelector(".interactive");

/**
 * @type {{formulas: Array<ActiveFormula>, texts:Array<ActiveText>}}
 */
let selected = {
    formulas: [],
    texts: [],
};

let state = {
    valueOf() {
        if (this.disable) return this.DIS;
        if (selected.formulas.length && selected.texts.length) return this.UNDEF;
        if (selected.formulas.length) return this.FORMULA;
        if (selected.texts.length) return this.TEXT;
        return this.NONE;
    },
    disable: false,
    DIS: 0,
    NONE: 1,
    UNDEF: 2,
    FORMULA: 3,
    TEXT: 4,
};
let newPartModes = {
    newLine: 0,
    addToEnd: 1,
    replace: 2,
};
/** @type {number} */
let newPartMode = newPartModes.addToEnd;

/**
 * @callback EventHandlerFunc
 * @type {{path:ActiveFormula, handlers:Array<{target:HTMLElement, func: HandlerFunc}>}} */
let focusFormulaConfig = null;

/**
 * TeX related to each IF element
 * @type {Array<{TeX: string, elem: HTMLElement}>}
 */
let contentTeX = [];


/**
 * @param {string} TeX
 * @param {HTMLElement} elem
 * @param {?HTMLElement} before
 */
function insertContent(TeX, elem, before) {
    contentTeX.push({TeX: TeX, elem: elem});

    deleteActiveAll();
    if (before) {
        interactiveField.insertBefore(elem, before);
    } else {
        interactiveField.append(elem);
    }
}

/**
 * @param {HTMLElement} elem element fith formula to be deleted
 */
function deleteContent(elem) {
    contentTeX.splice(contentTeX.findIndex((obj)=>obj.elem==elem), 1);
    deleteActiveAll();
    interactiveField.removeChild(elem);
}

/** delete all elements from IF */
function clearContent() {
    for (let child of interactiveField.children) {
        deleteContent(child);
    }
}

/**
 * Add formula element to interactiveField
 * @param {Formula} formula formula to be inserted
 * @param {?HTMLElement} before insert before
 */
function insertFormula(formula, before) {
    let elem = document.createElement("div");
    elem.innerHTML = `\\(${formula.toTex()}\\)`;
    elem.className = "content-formula";

    MathJax.typeset([elem]);
    insertContent(`$$${formula.toTex()}$$`, elem, before);
    prepareHTML(elem, formula.copy());
}

/**
 * Replace formula in ineractive field
 * @param {Formula} formula new formula
 * @param {HTMLElement} elem displayed formula/part of formula
 */
function replaceFormula(formula, elem) {
    for (let main of interactiveField.children) {
        if (main.contains(elem)) {
            insertFormula(formula, main);
            deleteContent(main);
        }
    }
}

/**
 * Add formula element to interactiveField
 * @param {string} text formula to be inserted
 * @param {?HTMLElement} before insert before
 */
function insertText(text, before) {
    let elem = document.createElement("div");
    elem.innerHTML = text;
    elem.className = "content-text";

    MathJax.typeset([elem]);
    insertContent(text, elem, before);
    textHandler(elem, text);
}

function insertTeX(text) {
    try {
        if (text.startsWith("$$") && text.endsWith("$$")) {
            let formula = formulaFromTeX(text.slice(2, -2));
            insertFormula(formula);
        } else {
            if (!checkText(text)) throw new Error();
            insertText(text);
        }
    } catch (e) {
        console.log(e, "Can not insert content");
        return;
    }
}

