/**
 * Wrap changed parts depending on the equality mode and focus mode
 * @param {Block} newPart equlity part
 * @param {ActiveFormula} active
 * @param {boolean} focused
 * @return {Formula}
 */
function _wrapPart(newPart, active, focused=false) {
    if (focused) {
        newPart = active.formula.substituteMultiplier(active.mult, active.term, new Formula([newPart]));
        return _wrapPart(newPart, active);
    }
    if (newPartMode==newPartModes.addToEnd) {
        active.formula.equalityParts.push(newPart);
        return active.formula.copy();
    }
    return active.formula.copyWithModifiedPart(newPart, active.term, newPartMode==newPartModes.newLine);
}

/**
 * Insert formula to IF depanding on newPartMode
 * @param {Formula} formula
 * @param {HTMLElement} activeHTML rendered active elment
 */
function _addFormula(formula, activeHTML) {
    if (newPartMode == newPartModes.newLine) {
        insertFormula(formula);
    } else {
        replaceFormula(formula, activeHTML);
    }
}

let formulaActions = [
    {
        buttonId: "separate-btn",
        check() {
            return selected.formulas[0].formula.equalityParts.length >= 2 && selected.formulas.length == 1 &&
                (_getActiveType(selected.formulas[0]) == _activeTypes.term ||
                _getActiveType(selected.formulas[0]) == _activeTypes.mult);
        },
        caller() {
            if (_getActiveType(selected.formulas[0]) == _activeTypes.term) {
                insertFormula( selected.formulas[0].formula.separateTerm(selected.formulas[0].main));
            } else {
                insertFormula(selected.formulas[0].formula.separateMultiplier(selected.formulas[0].main,
                    selected.formulas[0].term));
            }
        },
    },
    {
        buttonId: "substitute-btn",
        check() {
            return selected.formulas.length == 2 && selected.formulas[0].main.isEqual(selected.formulas[1].main) &&
                selected.formulas[0].formula.isSeparatedTerm(selected.formulas[0].term) &&
                (_getActiveType(selected.formulas[0]) == _activeTypes.term ||
                (_getActiveType(selected.formulas[0]) == _activeTypes.mult &&
                selected.formulas[0].formula.isSeparatedMultiplier(selected.formulas[0].main)));
        },
        caller() {
            let newPart;
            if (_getActiveType(selected.formulas[0]) == _activeTypes.term) {
                newPart = selected.formulas[1].formula.substituteTerm(selected.formulas[1].main,
                    selected.formulas[0].formula);
            } else {
                newPart = selected.formulas[1].formula.substituteMultiplier(selected.formulas[1].main,
                    selected.formulas[1].term, selected.formulas[0].formula);
            }
            let focused = (focusFormulaConfig &&
                 selected.formulas[1].formula.equalityParts[0]==focusFormulaConfig.path.mult);
            _addFormula(_wrapPart(newPart, focused?focusFormulaConfig.path: selected.formulas[1], focused),
                selected.formulas[1].HTML);
        },
    },
    {
        buttonId: "common-denominator-btn",
        check() {
            if (selected.formulas.length<2 || !selected.formulas.every((item) => item.main instanceof Term)) {
                return false;
            }
            let part = selected.formulas[0].formula._getActivePart(selected.formulas[0].main);
            return selected.formulas.every((item) => item.formula._getActivePart(item.main)==part);
        },
        caller() {
            let terms = selected.formulas.map((value) => value.main);
            let newPart = selected.formulas[0].formula.toCommonDenominator(...terms);
            let focused = (focusFormulaConfig &&
                selected.formulas[0].formula.equalityParts[0]==focusFormulaConfig.path.mult);
            _addFormula(_wrapPart(newPart, focused?focusFormulaConfig.path: selected.formulas[0], focused),
                selected.formulas[0].HTML);
        },
    },
    {
        buttonId: "open-bracket-btn",
        check() {
            return selected.formulas.length == 1 && selected.formulas[0].main instanceof Block;
        },
        caller() {
            let newPart;
            if (selected.formulas[0].term.content.includes(selected.formulas[0].main)) {
                newPart = selected.formulas[0].formula.openBrackets(selected.formulas[0].main,
                    selected.formulas[0].term);
            } else {
                newPart = selected.formulas[0].formula.openBracketsFrac(selected.formulas[0].main,
                    selected.formulas[0].term);
            }
            let focused = (focusFormulaConfig &&
                selected.formulas[0].formula.equalityParts[0]==focusFormulaConfig.path.mult);
            _addFormula(_wrapPart(newPart, focused?focusFormulaConfig.path: selected.formulas[0], focused),
                selected.formulas[0].HTML);
        },
    },
    {
        buttonId: "out-bracket-btn",
        check() {
            if (selected.formulas.length<2 || !selected.formulas.every((item) => item.main instanceof Term)) {
                return false;
            }
            let part = selected.formulas[0].formula._getActivePart(selected.formulas[0].main);
            return selected.formulas.every((item) => item.formula._getActivePart(item.main)==part);
        },
        async caller() {
            let multFormula = await formulaInput();
            if (multFormula.equalityParts.length>1) return;
            let multBlock = multFormula.equalityParts[0];
            let terms = [...selected.formulas.map((value) => value.main)];
            let newPart = selected.formulas[0].formula.moveOutOfBracket(terms, multBlock);
            let focused = (focusFormulaConfig &&
                selected.formulas[0].formula.equalityParts[0]==focusFormulaConfig.path.mult);
            _addFormula(_wrapPart(newPart, focused?focusFormulaConfig.path: selected.formulas[0], focused),
                selected.formulas[0].HTML);
        },
    },
    {
        buttonId: "multiply-btn",
        check() {
            return _getActiveType(selected.formulas[0]) == _activeTypes.formula && selected.formulas.length == 1;
        },
        async caller() {
            let multFormula = await formulaInput();
            if (multFormula.equalityParts.length>1) return;
            let multBlock = multFormula.equalityParts[0];

            insertFormula(selected.formulas[0].formula.multiply(multBlock));
        },
    },
    {
        buttonId: "remove-eponent-btn",
        check() {
            return selected.formulas.length==1 && selected.formulas[0].main instanceof Power &&
                selected.formulas[0].formula.isSeparatedMultiplier(selected.formulas[0].main);
        },
        caller() {
            insertFormula(selected.formulas[0].formula.removeExponent(selected.formulas[0].main));
        },
    },
    {
        buttonId: "add-btn",
        check() {
            return selected.formulas.every((item)=> _getActiveType(item) == _activeTypes.formula );
        },
        caller() {
            insertFormula(selected.formulas[0].main.add(...selected.formulas.slice(1).map((value) => value.main)));
        },
    },
    {
        buttonId: "substract-btn",
        check() {
            return selected.formulas.length == 2 &&
                selected.formulas.every((item)=>_getActiveType(item) == _activeTypes.formula);
        },
        caller() {
            insertFormula(selected.formulas[0].main.subtract(selected.formulas[1].main));
        },
    },
    {
        buttonId: "devide-btn",
        check() {
            return selected.formulas.length == 2 &&
                selected.formulas.every((item)=> _getActiveType(item) == _activeTypes.formula );
        },
        caller() {
            insertFormula(selected.formulas[0].main.divide(selected.formulas[1].main));
        },
    },
    {
        buttonId: "focus-btn",
        check() {
            return (selected.formulas.length==1 && selected.formulas[0].main instanceof Block) ||
                focusFormulaConfig;
        },
        caller() {
            if (selected.formulas.length==1 && selected.formulas[0].main instanceof Block) {
                document.querySelector(`#${this.buttonId}`).innerHTML = "Remove focus";
                focusFormulaConfig = {
                    path: selected.formulas[0],
                    handlers: [],
                };
                formulaHandler(new Formula([focusFormulaConfig.path.main]), focusFormulaConfig.path.HTML);
                prepareTerms(focusFormulaConfig.path.HTML, focusFormulaConfig.path.main);
            } else if (focusFormulaConfig) {
                document.querySelector(`#${this.buttonId}`).innerHTML = "Focus";
                for (let handler of focusFormulaConfig.handlers) {
                    handler.target.removeEventListener("click", handler.func);
                }
                deleteTermGroups(focusFormulaConfig.path.HTML);
                focusFormulaConfig = null;
            }
            deleteActiveAll();
        },
    },
];
