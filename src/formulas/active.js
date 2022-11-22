/**
 * @typedef {{main: MathStructure, HTML: HTMLElement , mult: ?MathStructure, term: ?Term, formula: ?Formula}} Active
 * Description of active element
 */

/** @type {Array<Active>} */
let activeFormulas = []; // array of description of selected elements

let _activeTypes = {
    mult: 0,
    term: 1,
    formula: 2,
};

/**
 * Returns type of active element
 * @param {MathStructure} struct active element
 * @return {number} active element type id
 */
function _getActiveType(struct) {
    if (struct instanceof Formula) {
        return _activeTypes.formula;
    } if (struct instanceof Term) {
        return _activeTypes.term;
    } if (struct instanceof MathStructure) {
        return _activeTypes.mult;
    }
    throw new Error("Struct must be MathStructure instance");
}

/**
 * Set selected element
 * @param {Active} active description of selected element
 */
function setActive(active) {
    if (state != "none" && state!="formula") return;

    deleteActiveAll();
    _setStyle(active);
    activeFormulas.push(active);

    state="formula";
}

/**
 * Add element to selected list
 * @param {Active} active description of selected element
 */
function addActive(active) {
    if (state != "none" && state!="formula") return;

    for (let key in active) {
        deleteActive(active[key]);
    }

    _setStyle(active);
    activeFormulas.push(active);
}

/**
 * set css class to html element depending on the activeType
 * @param {Active} active selected element
 * @param {string} [method="add"] "add" or "remove" css class
 */
function _setStyle(active, method = "add") {
    switch (_getActiveType(active.main)) {
    case _activeTypes.formula:
        active.HTML.classList[method]("active-formula");
        break;
    case _activeTypes.term:
        active.HTML.classList[method]("active-term");
        break;
    case _activeTypes.mult:
        active.HTML.classList[method]("active-mult");
        break;
    }
}

/**
 * Remove element from selected
 * @param {MathStructure} elem
 */
function deleteActive(elem) {
    if (state!="formula") return;

    for (let i = 0; i < activeFormulas.length; i++) {
        if (activeFormulas[i].main == elem) {
            _setStyle(activeFormulas[i], "remove");
            activeFormulas.splice(i, 1);
            break;
        }
    }
}

/**
 * Remove all selected elements
 */
function deleteActiveAll() {
    if (state!="formula") return;

    for (let obj of activeFormulas) {
        _setStyle(obj, "remove");
    }

    activeFormulas = [];
}

/**
 * Is element selected
 * @param {MathStructure} elem // checked element
 * @param {string} [param = "main" ] // one of Active properties in witch
 * @return {boolean}
 */
function _isActive(elem, param = "main") {
    for (let obj of activeFormulas) {
        if (obj[param] == elem) {
            return true;
        }
    }
    return false;
}

/**
 * Set click handler for multiplier
 * @param {MathStructure} mult
 * @param {HTMLElement} elem
 */
function multiplierHandler(mult, elem) {
    elem.addEventListener("click", (event) => {
        if (_isActive(mult)) {
            deleteActive(mult);
            event.stopPropagation();
            return;
        };

        event.clickDescription = {
            main: mult,
            HTML: elem,
            mult: mult,
        };
    });
}

/**
 * Set click handler for term
 * @param {Term} term
 * @param {HTMLElement} elem
 */
function termHandler(term, elem) {
    elem.addEventListener("click", (event) => {
        if (event.clickDescription) {
            if (!_isActive(term, "term")) {
                event.clickDescription.main = term;
                event.clickDescription.HTML = elem;
                delete event.clickDescription.mult;
            }
        } else {
            event.clickDescription = {
                main: term,
                HTML: elem,
            };
        }
        event.clickDescription.term = term;

        if (event.clickDescription.main == term && _isActive(term)) {
            deleteActive(term);
            event.stopPropagation();
        }
    });
}

/**
 * Set click handler for formula
 * @param {Formula} formula
 * @param {HTMLElement} elem
 */
function formulaHandler(formula, elem) {
    elem.addEventListener("click", (event) => {
        if (!event.clickDescription) {
            event.clickDescription = {
                main: formula,
                HTML: elem,
            };
        }
        event.clickDescription.formula = formula;

        if (event.clickDescription.main == formula && _isActive(formula)) {
            deleteActive(formula);
            return;
        }

        if (event.shiftKey) {
            addActive(event.clickDescription);
        } else {
            setActive(event.clickDescription);
        }
    });
}


