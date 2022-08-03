class InteractiveField {
    static _activeTypes = {
        mult: 0,
        term: 1,
        formula: 2,
    };

    constructor(elem) {
        this.main = elem;
        this.formulas = [];
        this.active = [];

        this.main.addEventListener("click", (event) => {
            if (event.target == this.main) {
                this.deleteActiveAll();
            }
        });
    }


    _getActiveType(struct) {
        if (struct instanceof Formula) {
            return InteractiveField._activeTypes.formula;
        } else if (struct instanceof Term) {
            return InteractiveField._activeTypes.term;
        } else {
            return InteractiveField._activeTypes.mult;
        }
    }

    setActive(active) {
        this.deleteActiveAll();

        this._setBorder(active.element);
        this.active.push(active);
    }

    addActive(active) {
        for (let key in active) {
            this.deleteActive(active[key]);
        }

        this._setBorder(active.element);
        this.active.push(active);
    }

    _setBorder(struct) {
        switch (this._getActiveType(struct)) {
        case InteractiveField._activeTypes.formula:
            struct.HTMLElement.style.borderStyle = "dotted";
            break;
        case InteractiveField._activeTypes.term:
            struct.HTMLElement.style.borderStyle = "dashed";
            break;
        case InteractiveField._activeTypes.mult:
            struct.HTMLElement.style.borderStyle = "solid";
            break;
        }
    }

    deleteActive(elem) {
        for (let i = 0; i < this.active.length; i++) {
            if (this.active[i].element == elem) {
                this.active[i].element.HTMLElement.style.borderStyle = "none";
                this.active.splice(i, 1);
                return;
            }
        }
    }

    deleteActiveAll() {
        for (let obj of this.active) {
            obj.element.HTMLElement.style.borderStyle = "none";
        }

        this.active = [];
    }

    _isActive(elem, param = "element") {
        for (let obj of this.active) {
            if (obj[param] == elem) {
                return true;
            }
        }
        return false;
    }

    insertContent(content) {
        this.main.append(content);

        let formula = Formula.fromHTML(content);
        this.formulas.push(formula);

        this._setHandlers(formula.leftPart());
        this._setHandlers(formula.rightPart());
        this.formulaHandler(formula);
    }

    _setHandlers(block) {
        for (let term of block.content) {
            this.termHandler(term);
            term.allMultipliers().forEach((elem) => {
                this.multiplierHandler(elem);
            });
        }
    }

    multiplierHandler(mult) {
        mult.HTMLElement.addEventListener("click", (event) => {
            if (this._isActive(mult)) {
                this.deleteActive(mult);
                event.stopPropagation();
                return;
            };

            event.clickDescription = {
                element: mult,
                mult: mult,
            };
        });
    }

    termHandler(term) {
        term.HTMLElement.addEventListener("click", (event) => {
            if (event.clickDescription) {
                if (!this._isActive(term, "term")) {
                    event.clickDescription.element = term;
                    delete event.clickDescription.mult;
                }
            } else {
                event.clickDescription = {
                    element: term,
                };
            }
            event.clickDescription.term = term;

            if (event.clickDescription.element == term && this._isActive(term)) {
                this.deleteActive(term);
                event.stopPropagation();
            }
        });
    }

    formulaHandler(formula) {
        formula.HTMLElement.addEventListener("click", (event) => {
            if (!event.clickDescription) {
                event.clickDescription = {
                    element: formula,
                };
            }
            event.clickDescription.formula = formula;

            if (event.clickDescription.element == formula && this._isActive(formula)) {
                this.deleteActive(formula);
                return;
            }

            if (event.shiftKey) {
                this.addActive(event.clickDescription);
            } else {
                this.setActive(event.clickDescription);
            }
        });
    }

    separateTerm() {
        if (this.active.length != 1 ||
            this._getActiveType(this.active[0].element) != InteractiveField._activeTypes.term) return;

        let newFormula = this.active[0].formula.separateTerm(this.active[0].element);
        this.insertContent(createFormula(newFormula.toTex()));
    }

    separateMultiplier() {
        if (this.active.length != 1 ||
            this._getActiveType(this.active[0].element) != InteractiveField._activeTypes.mult) return;

        let newFormula = this.active[0].formula.separateMultiplier(this.active[0].element, this.active[0].term);
        this.insertContent(createFormula(newFormula.toTex()));
    }

    openBrackets() {
        if (this.active.length != 1 || (!this.active[0].element instanceof Block)) return;

        let newFormula = this.active[0].formula.openBrackets(this.active[0].element, this.active[0].term);
        this.insertContent(createFormula(newFormula.toTex()));
    }

    substitute() {
        if (this.active.length != 2 ||
            !this.active[0].element.isEqual(this.active[1].element) ||
            !this.active[0].formula.isSeparatedTerm(this.active[0].term)) return;

        let newFormula;
        if (this._getActiveType(this.active[0].element) == InteractiveField._activeTypes.term) {
            newFormula = this.active[1].formula.substituteTerm(this.active[1].element, this.active[0].formula);
        } else if (this._getActiveType(this.active[0].element) == InteractiveField._activeTypes.mult &&
            this.active[0].formula.isSeparatedMultiplier(this.active[0].element)) {
            newFormula = this.active[1].formula.substituteMultiplier(this.active[1].element,
                this.active[1].term, this.active[0].formula);
        } else return;

        this.insertContent(createFormula(newFormula.toTex()));
    }

    addEquations() {
        for (let item of this.active) {
            if (this._getActiveType(item.element) != InteractiveField._activeTypes.formula) return;
        }

        let newFormula = this.active[0].element.add(...this.active.slice(1).map((value) => value.element));
        this.insertContent(createFormula(newFormula.toTex()));
    }

    subtractEquations() {
        if (this.active.length != 2) return;
        for (let item of this.active) {
            if (this._getActiveType(item.element) != InteractiveField._activeTypes.formula) return;
        }

        let newFormula = this.active[0].element.subtract(this.active[1].element);
        this.insertContent(createFormula(newFormula.toTex()));
    }

    divideEquations() {
        if (this.active.length != 2) return;
        for (let item of this.active) {
            if (this._getActiveType(item.element) != InteractiveField._activeTypes.formula) return;
        }

        let newFormula = this.active[0].element.divide(this.active[1].element);
        this.insertContent(createFormula(newFormula.toTex()));
    }
}


