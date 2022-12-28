/**
 * Wrap changed parts depending on the equality mode and focus mode
 * @param {Block} newPart equlity part
 * @param {Active} active
 * @param {boolean} focused
 * @return {Formula}
 */
function _wrapPart(newPart, active, focused=false) {
    if (focused) {
        newPart = active.formula.substituteMultiplier(active.mult, active.term, new Formula([newPart]));
        return _wrapPart(newPart, active);
    }
    return active.formula.copyWithModifiedPart(newPart, active.term);
}

let formulaActions = [
    {
        buttonId: "separate-btn",
        check() {
            return activeFormulas[0].formula.equalityParts.length >= 2 && activeFormulas.length == 1 &&
                (_getActiveType(activeFormulas[0].main) == _activeTypes.term ||
                _getActiveType(activeFormulas[0].main) == _activeTypes.mult);
        },
        async caller() {
            if (_getActiveType(activeFormulas[0].main) == _activeTypes.term) {
                return activeFormulas[0].formula.separateTerm(activeFormulas[0].main);
            }
            return activeFormulas[0].formula.separateMultiplier(activeFormulas[0].main,
                activeFormulas[0].term);
        },
    },
    {
        buttonId: "substitute-btn",
        check() {
            return activeFormulas.length == 2 && activeFormulas[0].main.isEqual(activeFormulas[1].main) &&
                activeFormulas[0].formula.isSeparatedTerm(activeFormulas[0].term) &&
                (_getActiveType(activeFormulas[0].main) == _activeTypes.term ||
                (_getActiveType(activeFormulas[0].main) == _activeTypes.mult &&
                activeFormulas[0].formula.isSeparatedMultiplier(activeFormulas[0].main)));
        },
        async caller() {
            let newPart;
            if (_getActiveType(activeFormulas[0].main) == _activeTypes.term) {
                newPart = activeFormulas[1].formula.substituteTerm(activeFormulas[1].main,
                    activeFormulas[0].formula);
            } else {
                newPart = activeFormulas[1].formula.substituteMultiplier(activeFormulas[1].main,
                    activeFormulas[1].term, activeFormulas[0].formula);
            }
            let focused = (state == states.formulaFocus &&
                activeFormulas[1].formula.equalityParts[0]==focusFormulaConfig.path.mult);
            return _wrapPart(newPart, focused?focusFormulaConfig.path: activeFormulas[1], focused);
        },
    },
    {
        buttonId: "common-denominator-btn",
        check() {
            if (activeFormulas.length<2 || !activeFormulas.every((item) => item.main instanceof Term)) return false;
            let part = activeFormulas[0].formula._getActivePart(activeFormulas[0].main);
            return activeFormulas.every((item) => item.formula._getActivePart(item.main)==part);
        },
        async caller() {
            let terms = activeFormulas.map((value) => value.main);
            let newPart = activeFormulas[0].formula.toCommonDenominator(...terms);
            return activeFormulas[0].formula.copyWithModifiedPart(newPart, terms[0]);
        },
    },
    {
        buttonId: "open-bracket-btn",
        check() {
            return activeFormulas.length == 1 && activeFormulas[0].main instanceof Block &&
                activeFormulas[0].term.content.includes(activeFormulas[0].main);
        },
        async caller() {
            let newPart = activeFormulas[0].formula.openBrackets(activeFormulas[0].main, activeFormulas[0].term);
            return activeFormulas[0].formula.copyWithModifiedPart(newPart, activeFormulas[0].term);
        },
    },
    {
        buttonId: "out-bracket-btn",
        check() {
            if (activeFormulas.length<2 || !activeFormulas.every((item) => item.main instanceof Term)) return false;
            let part = activeFormulas[0].formula._getActivePart(activeFormulas[0].main);
            return activeFormulas.every((item) => item.formula._getActivePart(item.main)==part);
        },
        async caller() {
            let multFormula = await formulaInput();
            if (multFormula.equalityParts.length>1) return;
            let multBlock = multFormula.equalityParts[0];
            let terms = [...activeFormulas.map((value) => value.main)];
            let newPart = activeFormulas[0].formula.moveOutOfBracket(terms, multBlock);
            return activeFormulas[0].formula.copyWithModifiedPart(newPart, terms[0]);
        },
    },
    {
        buttonId: "multiply-btn",
        check() {
            return _getActiveType(activeFormulas[0].main) == _activeTypes.formula && activeFormulas.length == 1;
        },
        async caller() {
            let multFormula = await formulaInput();
            if (multFormula.equalityParts.length>1) return;
            let multBlock = multFormula.equalityParts[0];

            return activeFormulas[0].formula.multiply(multBlock);
        },
    },
    {
        buttonId: "remove-eponent-btn",
        check() {
            return activeFormulas.length==1 && activeFormulas[0].main instanceof Power &&
                activeFormulas[0].formula.isSeparatedMultiplier(activeFormulas[0].main);
        },
        async caller() {
            return activeFormulas[0].formula.removeExponent(activeFormulas[0].main);
        },
    },
    {
        buttonId: "add-btn",
        check() {
            return activeFormulas.every((item)=> _getActiveType(item.main) == _activeTypes.formula );
        },
        async caller() {
            return activeFormulas[0].main.add(...activeFormulas.slice(1).map((value) => value.main));
        },
    },
    {
        buttonId: "substract-btn",
        check() {
            return activeFormulas.length == 2 &&
                activeFormulas.every((item)=>_getActiveType(item.main) == _activeTypes.formula);
        },
        async caller() {
            return activeFormulas[0].main.subtract(activeFormulas[1].main);
        },
    },
    {
        buttonId: "devide-btn",
        check() {
            return activeFormulas.length == 2 &&
                activeFormulas.every((item)=> _getActiveType(item.main) == _activeTypes.formula );
        },
        async caller() {
            return activeFormulas[0].main.divide(activeFormulas[1].main);
        },
    },
];
