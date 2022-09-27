/**
 * @typedef {{main: MathStructure, HTML: HTMLElement , mult: ?MathStructure, term: ?Term, formula: ?Formula}} Active
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
     * @return {number} active element type id
     */
    _getActiveType(struct) {
        if (struct instanceof Formula) {
            return InteractiveField._activeTypes.formula;
        } else if (struct instanceof Term) {
            return InteractiveField._activeTypes.term;
        } else if (struct instanceof MathStructure) {
            return InteractiveField._activeTypes.mult;
        } else {
            throw new Error("Struct must be MathStructure instance");
        }
    }

    /**
     * Set selected element
     * @param {Active} active description of selected element
     */
    setActive(active) {
        this.deleteActiveAll();

        this._setStyle(active);
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

        this._setStyle(active);
        this.active.push(active);
    }

    /**
     * set css class to html element depending on the activeType
     * @param {Active} active selected element
     * @param {string} [method="add"] "add" or "remove" css class
     */
    _setStyle(active, method="add") {
        switch (this._getActiveType(active.main)) {
        case InteractiveField._activeTypes.formula:
            active.HTML.classList[method]("active-formula");
            break;
        case InteractiveField._activeTypes.term:
            active.HTML.classList[method]("active-term");
            break;
        case InteractiveField._activeTypes.mult:
            active.HTML.classList[method]("active-mult");
            break;
        }
    }

    /**
     * Remove element from selected
     * @param {MathStructure} elem
     */
    deleteActive(elem) {
        for (let i = 0; i < this.active.length; i++) {
            if (this.active[i].main == elem) {
                this._setStyle(this.active[i], "remove");
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
            this._setStyle(obj, "remove");
        }

        this.active = [];
    }

    /**
     * Is element selected
     * @param {MathStructure} elem // checked element
     * @param {string} [param = "main" ] // one of Active properties in witch
     * @return {boolean}
     */
    _isActive(elem, param = "main") {
        for (let obj of this.active) {
            if (obj[param] == elem) {
                return true;
            }
        }
        return false;
    }

    /**
     * Add formula element to interactiveField
     * @param {HTMLElement} TeX element with visualised formula
     */
    insertFormula(TeX) {
        let formula = formulaFromTeX(TeX);
        this.formulas.push(formula);

        let elem = document.createElement("div");
        elem.innerHTML = `$$${TeX}$$`;
        elem.className = "content-formula";

        this.main.append(elem);
        MathJax.Hub.Queue(
            ["Typeset", MathJax.Hub, elem],
            ["prepareHTML", this, elem, formula],
            // ["append",this.main, elem],
        );
    }

    /**
     * Set click handler for multiplier
     * @param {MathStructure} mult
     * @param {HTMLElement} elem
     */
    multiplierHandler(mult, elem) {
        elem.addEventListener("click", (event) => {
            if (this._isActive(mult)) {
                this.deleteActive(mult);
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
    termHandler(term, elem) {
        elem.addEventListener("click", (event) => {
            if (event.clickDescription) {
                if (!this._isActive(term, "term")) {
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

            if (event.clickDescription.main == term && this._isActive(term)) {
                this.deleteActive(term);
                event.stopPropagation();
            }
        });
    }

    /**
     * Set click handler for formula
     * @param {Formula} formula
     * @param {HTMLElement} elem
     */
    formulaHandler(formula, elem) {
        elem.addEventListener("click", (event) => {
            if (!event.clickDescription) {
                event.clickDescription = {
                    main: formula,
                    HTML: elem,
                };
            }
            event.clickDescription.formula = formula;

            if (event.clickDescription.main == formula && this._isActive(formula)) {
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
            this._getActiveType(this.active[0].main) != InteractiveField._activeTypes.term) return;

        let newFormula = this.active[0].formula.separateTerm(this.active[0].main);
        this.insertFormula(newFormula.toTex());
    }

    separateMultiplier() {
        if (this.active.length != 1 ||
            this._getActiveType(this.active[0].main) != InteractiveField._activeTypes.mult) return;

        let newFormula = this.active[0].formula.separateMultiplier(this.active[0].main, this.active[0].term);
        this.insertFormula(newFormula.toTex());
    }

    openBrackets() {
        if (this.active.length != 1 || (!this.active[0].main instanceof Block)) return;

        let newFormula = this.active[0].formula.openBrackets(this.active[0].main, this.active[0].term);
        this.insertFormula(newFormula.toTex());
    }

    substitute() {
        if (this.active.length != 2 ||
            !this.active[0].main.isEqual(this.active[1].main) ||
            !this.active[0].formula.isSeparatedTerm(this.active[0].term)) return;

        let newFormula;
        if (this._getActiveType(this.active[0].main) == InteractiveField._activeTypes.term) {
            newFormula = this.active[1].formula.substituteTerm(this.active[1].main, this.active[0].formula);
        } else if (this._getActiveType(this.active[0].main) == InteractiveField._activeTypes.mult &&
            this.active[0].formula.isSeparatedMultiplier(this.active[0].main)) {
            newFormula = this.active[1].formula.substituteMultiplier(this.active[1].main,
                this.active[1].term, this.active[0].formula);
        } else return;

        this.insertFormula(newFormula.toTex());
    }

    addEquations() {
        for (let item of this.active) {
            if (this._getActiveType(item.main) != InteractiveField._activeTypes.formula) return;
        }

        let newFormula = this.active[0].main.add(...this.active.slice(1).map((value) => value.main));
        this.insertFormula(newFormula.toTex());
    }

    subtractEquations() {
        if (this.active.length != 2) return;
        for (let item of this.active) {
            if (this._getActiveType(item.main) != InteractiveField._activeTypes.formula) return;
        }

        let newFormula = this.active[0].main.subtract(this.active[1].main);
        this.insertFormula(newFormula.toTex());
    }

    divideEquations() {
        if (this.active.length != 2) return;
        for (let item of this.active) {
            if (this._getActiveType(item.main) != InteractiveField._activeTypes.formula) return;
        }

        let newFormula = this.active[0].main.divide(this.active[1].main);
        this.insertFormula(newFormula.toTex());
    }
}


