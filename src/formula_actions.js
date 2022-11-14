let formulaActions = [
    {
        buttonId: "separate-btn",
        check() {
            return activeFormulas.length == 1 && (_getActiveType(activeFormulas[0].main) == _activeTypes.term ||
                _getActiveType(activeFormulas[0].main) == _activeTypes.mult);
        },
        async caller() {
            if (_getActiveType(activeFormulas[0].main) == _activeTypes.term) {
                return activeFormulas[0].formula.separateTerm(activeFormulas[0].main);
            }
            return activeFormulas[0].formula.separateMultiplier(activeFormulas[0].main, activeFormulas[0].term);
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
            if (_getActiveType(activeFormulas[0].main) == _activeTypes.term) {
                return activeFormulas[1].formula.substituteTerm(activeFormulas[1].main, activeFormulas[0].formula);
            }
            return activeFormulas[1].formula.substituteMultiplier(activeFormulas[1].main, activeFormulas[1].term, activeFormulas[0].formula);
        },
    },
    {
        buttonId: "common-denominator-btn",
        check() {
            if (activeFormulas.length<2 && _getActiveType(activeFormulas[0].main) == _activeTypes.term) return false;
            let part = activeFormulas[0].formula._getActivePart(activeFormulas[0].main);
            for (let i=1; i<activeFormulas.length; i++) {
                if (_getActiveType(activeFormulas[0].main)!=_activeTypes.term ||
                    activeFormulas[i].formula._getActivePart(activeFormulas[i].main)!=part) return false;
            }
            return true;
        },
        async caller() {
            return activeFormulas[0].formula.toCommonDenominator(...activeFormulas.map((value) => value.main));
        },
    },
    {
        buttonId: "open-bracket-btn",
        check() {
            return activeFormulas.length == 1 && activeFormulas[0].main instanceof Block &&
                activeFormulas[0].term.content.includes(activeFormulas[0].main);
        },
        async caller() {
            return activeFormulas[0].formula.openBrackets(activeFormulas[0].main, activeFormulas[0].term);
        },
    },
    {
        buttonId: "out-bracket-btn",
        check() {
            if (activeFormulas.length<2 || !(activeFormulas[0].main instanceof Term)) return false;
            let part = activeFormulas[0].formula._getActivePart(activeFormulas[0].main);
            for (let i=1; i<activeFormulas.length; i++) {
                if (_getActiveType(activeFormulas[0].main)!=_activeTypes.term ||
                    activeFormulas[i].formula._getActivePart(activeFormulas[i].main)!=part) return false;
            }
            return true;
        },
        async caller() {
            let multFormula = await formulaInput();
            if(multFormula.equalityParts.length>1) return;
            let multBlock = multFormula.equalityParts[0];

            return activeFormulas[0].formula.moveOutOfBracket([...activeFormulas.map((value) => value.main)], multBlock);
        },
    },
    {
        buttonId: "multiply-btn",
        check() {
            return activeFormulas.length == 1 && _getActiveType(activeFormulas[0].main) == _activeTypes.formula;
        },
        async caller() {
            let multFormula = await formulaInput();
            if(multFormula.equalityParts.length>1) return;
            let multBlock = multFormula.equalityParts[0];

            return activeFormulas[0].formula.multiply(multBlock);
        },
    },
    {
        buttonId: "remove-eponent-btn",
        check() {
            return activeFormulas.length==1 && activeFormulas[0].main instanceof Power
                && activeFormulas[0].formula.isSeparatedMultiplier(activeFormulas[0].main);
                
        },
        async caller() {
            return activeFormulas[0].formula.removeExponent(activeFormulas[0].main);
        },
    },
    {
        buttonId: "add-btn",
        check() {
            for (let item of activeFormulas) {
                if (_getActiveType(item.main) != _activeTypes.formula) return false;
            }
            return true;
        },
        async caller() {
            return activeFormulas[0].main.add(...activeFormulas.slice(1).map((value) => value.main));
        },
    },
    {
        buttonId: "substract-btn",
        check() {
            if (activeFormulas.length != 2) return false;
            for (let item of activeFormulas) {
                if (_getActiveType(item.main) != _activeTypes.formula) return false;
            }
            return true;
        },
        async caller() {
            return activeFormulas[0].main.subtract(activeFormulas[1].main);
        },
    },
    {
        buttonId: "devide-btn",
        check() {
            if (activeFormulas.length != 2) return false;
            for (let item of activeFormulas) {
                if (_getActiveType(item.main) != _activeTypes.formula) return false;
            }
            return true;
        },
        async caller() {
            return activeFormulas[0].main.divide(activeFormulas[1].main);
        },
    },
];
