let formulaActions = [
    {
        buttonId: "separate-btn",
        state: [states.formula],
        check() {
            return (_getActiveType(activeFormulas[0].main) == _activeTypes.term ||
                _getActiveType(activeFormulas[0].main) == _activeTypes.mult) && activeFormulas.length == 1;
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
        state: [states.formula, states.formulaFocus],
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
            return activeFormulas[1].formula.copyWithModifiedPart(newPart, activeFormulas[1].term);
        },
    },
    {
        buttonId: "common-denominator-btn",
        state: [states.formula, states.formulaFocus],
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
        state: [states.formula, states.formulaFocus],
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
        state: [states.formula, states.formulaFocus],
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
        state: [states.formula],
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
        state: [states.formula],
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
        state: [states.formula],
        check() {
            return activeFormulas.every((item)=> _getActiveType(item.main) == _activeTypes.formula );
        },
        async caller() {
            return activeFormulas[0].main.add(...activeFormulas.slice(1).map((value) => value.main));
        },
    },
    {
        buttonId: "substract-btn",
        state: [states.formula],
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
        state: [states.formula],
        check() {
            return activeFormulas.length == 2 &&
                activeFormulas.every((item)=> _getActiveType(item.main) == _activeTypes.formula );
        },
        async caller() {
            return activeFormulas[0].main.divide(activeFormulas[1].main);
        },
    },
];
