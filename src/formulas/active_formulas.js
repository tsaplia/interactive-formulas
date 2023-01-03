/**
 * Set selected element
 * @param {ActiveFormula} active description of selected element
 */
function setFormulaActive(active) {
    deleteActiveAll();
    setSelectedStyle(active);
    selected.formulas.push(active);
}

/**
 * Add element to selected list
 * @param {ActiveFormula} active description of selected element
 */
function addFormulaActive(active) {
    for (let key in active) {
        deleteFormulaActive(active[key]);
    }

    setSelectedStyle(active);
    selected.formulas.push(active);
}

/**
 * Remove element from selected
 * @param {MathStructure} elem
 */
function deleteFormulaActive(elem) {
    for (let i = 0; i < selected.formulas.length; i++) {
        if (selected.formulas[i].main == elem) {
            setSelectedStyle(selected.formulas[i]);
            selected.formulas.splice(i, 1);
            break;
        }
    }
}

/**
 * Is element selected
 * @param {MathStructure} elem  checked element
 * @param {string} [param = "main" ] one of Active properties in witch
 * @return {boolean}
 */
function _isActive(elem, param = "main") {
    for (let obj of selected.formulas) {
        if (obj[param] == elem) {
            return true;
        }
    }
    return false;
}

/**
 * Add a handler and save it depending on the state
 * @param {HTMLElement} elem
 * @param {EventHandlerFunc} func
 */
function _addHandler(elem, func) {
    elem.addEventListener("click", func);
    if (focusFormulaConfig && focusFormulaConfig.path.HTML.contains(elem)) {
        focusFormulaConfig.handlers.push({target: elem, func: func});
    }
}

/**
 * Set click handler for multiplier
 * @param {MathStructure} mult
 * @param {HTMLElement} elem
 */
function multiplierHandler(mult, elem) {
    _addHandler(elem, (event) => {
        if (state==state.DIS || (focusFormulaConfig && mult==focusFormulaConfig.path.mult)) return;

        if (_isActive(mult)) {
            deleteFormulaActive(mult);
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
    _addHandler(elem, (event) => {
        if (state==state.DIS) return;

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
            deleteFormulaActive(term);
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
    _addHandler(elem, (event) => {
        if (state==state.DIS) return;
        event.stopPropagation();

        if (!event.clickDescription) {
            event.clickDescription = {
                main: formula,
                HTML: elem,
            };
        }
        event.clickDescription.formula = formula;

        if (event.clickDescription.main == formula && _isActive(formula)) {
            deleteFormulaActive(formula);
            return;
        }

        if (event.shiftKey) {
            addFormulaActive(event.clickDescription);
        } else {
            setFormulaActive(event.clickDescription);
        }
    });
}


