/**
 * @typedef {{element: MathStructure, mult: ?MathStructure, term: ?Term, formula: ?Formula}} Active 
 * Description of active element
 */

class InteractiveField {
    constructor(elem) {
        /** @type {HTMLElement} */
        this.main = elem; // element in which phisic formulas/content are rendered

        /** @type {Array<Formula>} */
        this.formulas = []; // array of formulas from InteractiveField

        /** @type {Array<Active>} */
        this.active = []; // array of description of selected elements
        
        this.main.addEventListener("click", (event) => {
            if (event.target == this.main) {
                this.deleteActiveAll();
            }
        });
    }

    /**
     * @enum {Object<string, number>} possible types of active element returned by _getActiveType function
     */
     static _activeTypes = {
        mult: 0,
        term: 1,
        formula: 2,
    };

    /**
     * Returns type of active element
     * @param {MathStructure} struct active element
     * @returns {number} active element type id
     */
    _getActiveType(struct) {
        if (struct instanceof Formula) {
            return InteractiveField._activeTypes.formula;
        } else if (struct instanceof Term) {
            return InteractiveField._activeTypes.term;
        } else if (struct instanceof MathStructure) {
            return InteractiveField._activeTypes.mult;
        } else{
            throw new Error("Struct must be MathStructure instance")
        }
    }

    /**
     * Set selected element
     * @param {Active} active description of selected element
     */
    setActive(active) {
        this.deleteActiveAll();

        this._setBorder(active.element);
        this.active.push(active);
    }

    /**
     * Add element to selected list
     * @param {Active} active description of selected element
     */
    addActive(active) {
        for (let key in active) {
            this.deleteActive(active[key]);
        }

        this._setBorder(active.element);
        this.active.push(active);
    }

    /**
     * Set border to selected element
     * @param {MathStructure} struct selected element
     */
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

    /**
     * Remove element from selected
     * @param {MathStructure} elem 
     */
    deleteActive(elem) {
        for (let i = 0; i < this.active.length; i++) {
            if (this.active[i].element == elem) {
                this.active[i].element.HTMLElement.style.borderStyle = "none";
                this.active.splice(i, 1);
                break;
            }
        }
    }

    /**
     * Remove all selected elements
     */
    deleteActiveAll() {
        for (let obj of this.active) {
            obj.element.HTMLElement.style.borderStyle = "none";
        }

        this.active = [];
    }

    /**
     * Is element selected
     * @param {MathStructure} elem // checked element
     * @param {string} [param = "element" ] // one of Active properties in witch 
     * @returns {boolean} 
     */
    _isActive(elem, param = "element") {
        for (let obj of this.active) {
            if (obj[param] == elem) {
                return true;
            }
        }
        return false;
    }

    /**
     * Add formula element to interactiveField
     * @param {HTMLElement} content element with visualised formula
     */
    insertContent(content) {
        this.main.append(content);

        let formula = Formula.fromHTML(content);
        this.formulas.push(formula);

        this._setHandlers(formula.leftPart());
        this._setHandlers(formula.rightPart());
        this.formulaHandler(formula);
    }

    /**
     * Set click handlers for all up-lewel terms and multipliers
     * @param {Block} block
     */
    _setHandlers(block) {
        for (let term of block.content) {
            this.termHandler(term);
            term.allMultipliers().forEach((elem) => {
                this.multiplierHandler(elem);
            });
        }
    }

    /**
     * Set click handler for multiplier
     * @param {MathStructure} mult 
     */
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

    /**
     * Set click handler for term
     * @param {Term} term 
     */
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

    /**
     * Set click handler for formula
     * @param {Formula} formula 
     */
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


