function InteractiveField(elem) {
    this.main = elem;
    this.formulas = [];

    this.main.addEventListener("click", (event)=>{
        if (event.target == this.main) {
            this.deleteActiveAll();
        }
    });

    this.active = [];

    this._activeTypes = {
        mult: 0,
        term: 1,
        formula: 2,
    };

    this._getActiveType = function(struct) {
        if (struct instanceof Formula) {
            return this._activeTypes.formula;
        } else if (struct instanceof Term) {
            return this._activeTypes.term;
        } else {
            return this._activeTypes.mult;
        }
    };

    this.insertContent = function(content) {
        this.main.append(content);

        let formula = Formula.fromHTML(content);
        this.formulas.push(formula);

        this._setHandlers(formula.leftPart());
        this._setHandlers(formula.rightPart());
        this.formulaHandler(formula);
    };

    this._setHandlers = function(block) {
        for (let term of block.content) {
            this.termHandler(term);
            term.allMultipliers().forEach((elem) => {
                this.multiplierHandler(elem);
            });
        }
    };

    this.multiplierHandler = function(mult) {
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
    };

    this.termHandler = function(term) {
        term.HTMLElement.addEventListener("click", (event)=>{
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
    };

    this.formulaHandler = function(formula) {
        formula.HTMLElement.addEventListener("click", (event)=>{
            if (!event.clickDescription) {
                event.clickDescription = {
                    element: formula,
                };
            }
            event.clickDescription.formula = formula;

            if (event.clickDescription.element == formula && this._isActive(formula)) {
                this.deleteActive();
                return;
            }

            if (event.shiftKey) {
                this.addActive(event.clickDescription);
            } else {
                this.setActive(event.clickDescription);
            }
        });
    };

    this.setActive = function(active) {
        this.deleteActiveAll();

        this._setBorder(active.element);
        this.active.push(active);
    };

    this.addActive = function(active) {
        for (let key in active) {
            this.deleteActive(active[key]);
        }

        this._setBorder(active.element);
        this.active.push(active);
    };

    this._setBorder = function(struct) {
        switch (this._getActiveType(struct)) {
        case this._activeTypes.formula:
            struct.HTMLElement.style.borderStyle = "dotted";
            break;
        case this._activeTypes.term:
            struct.HTMLElement.style.borderStyle = "dashed";
            break;
        case this._activeTypes.mult:
            struct.HTMLElement.style.borderStyle = "solid";
            break;
        }
    };

    this.deleteActive = function(elem) {
        for (let i=0; i<this.active.length; i++) {
            if (this.active[i].element == elem) {
                this.active[i].element.HTMLElement.style.borderStyle = "none";
                this.active.splice(i, 1);
                return;
            }
        }
    };

    this.deleteActiveAll = function() {
        for (let obj of this.active) {
            obj.element.HTMLElement.style.borderStyle = "none";
        }

        this.active = [];
    };

    this._isActive = function(elem, param="element") {
        for (let obj of this.active) {
            if (obj[param] == elem) return true;
        }
        return false;
    };

    this.separateTerm = function() {
        if (this.active.length != 1 ||
            this._getActiveType(this.active[0].element) != this._activeTypes.term) return;

        let newFormula = this.active[0].formula.separateTerm(this.active[0].element);
        this.insertContent(createFormula(newFormula.toTex()));
    };

    this.separateMultiplier = function() {
        if (this.active.length != 1 ||
                this._getActiveType(this.active[0].element) != this._activeTypes.mult) return;

        let newFormula = this.active[0].formula.separateMultiplier(this.active[0].element, this.active[0].term);
        this.insertContent(createFormula(newFormula.toTex()));
    };

    this.openBrackets = function() {
        if (this.active.length != 1 || (!this.active[0].element instanceof Block)) return;

        let newFormula = this.active[0].formula.openBrackets(this.active[0].element, this.active[0].term);
        this.insertContent(createFormula(newFormula.toTex()));
    };

    this.substitute = function() {
        if (this.active.length != 2 ||
                !this.active[0].element.isEqual(this.active[1].element) ||
                !this.active[0].formula.isSeparatedTerm(this.active[0].term) ) return;

        let newFormula;
        if (this._getActiveType(this.active[0].element) == this._activeTypes.term) {
            newFormula = this.active[1].formula.substituteTerm(this.active[1].element, this.active[0].formula);
        } else if (this._getActiveType(this.active[0].element) == this._activeTypes.mult &&
                this.active[0].formula.isSeparatedMultiplier(this.active[0].element)) {
            newFormula = this.active[1].formula.substituteMultiplier(this.active[1].element,
                this.active[1].term, this.active[0].formula);
        } else return;

        this.insertContent(createFormula(newFormula.toTex()));
    };
}


function Formula(equalityParts) {
    this.equalityParts = equalityParts;

    this.leftPart = function() {
        return this.equalityParts[0];
    };

    this.rightPart = function() {
        return this.equalityParts.slice(-1)[0];
    };

    this._getActivePart = function(term) {
        if (this.leftPart().content.includes(term)) return this.leftPart();
        if (this.rightPart().content.includes(term)) return this.rightPart();
        else throw new Error();
    };

    this._getPassivePart = function(term) {
        if (this.leftPart().content.includes(term)) return this.rightPart();
        if (this.rightPart().content.includes(term)) return this.leftPart();
        else throw new Error();
    };

    this.isSeparatedTerm = function(term = null) {
        let f = this.leftPart().content.length == 1 && this.leftPart().content[0].sign == "+";
        if (term && this.leftPart().content[0] != term) f = false;
        return f;
    };

    this.isSeparatedMultiplier = function(mult = null) {
        let f = this.isSeparatedTerm() && this.leftPart().content[0].allMultipliers().length == 1 &&
                !(this.leftPart().content[0].content[0] instanceof Block);
        if (mult && this.leftPart().content[0].content[0] != mult) f = false;
        return f;
    };

    this.toTex = function() {
        let TeX = "";

        for (let part of this.equalityParts) {
            TeX += (TeX ? "=" : "" )+ part.toTex();
        }

        return TeX;
    };

    this.copy = function() {
        return new Formula(this.equalityParts.map((part)=>part.copy()));
    };

    this._copyWithModifiedPart = function(part, term) {
        if (this._getActivePart(term) == this.rightPart()) {
            return new Formula([this.leftPart(), part]);
        }

        return new Formula([part, this.rightPart().copy()]);
    };

    this.separateTerm = function(term) {
        let activePart = this._getActivePart(term);
        let passivePart = this._getPassivePart(term);

        let leftPart = Block.wrap(term.copy());
        let rightPart = passivePart.copy();

        for (let item of activePart.content) {
            if (item == term) continue;

            let newItem = item.copy();
            newItem.changeSign();
            rightPart.add(newItem);
        }

        if (term.sign == "-") {
            leftPart.changeSignes();
            rightPart.changeSignes();
        }

        rightPart.simplify();

        return new Formula([leftPart, rightPart]);
    };

    this.separateMultiplier = function(mult, term) {
        let leftPart;
        let rightPart;
        [leftPart, rightPart] = this.separateTerm(term).equalityParts;

        if (rightPart.content.length > 1) {
            rightPart = Block.wrap( new Frac(rightPart, Block.wrap(new Num(1))) );
        }

        leftPart.content[0].transformToFrac();
        if (leftPart.content[0].content[0].denomerator.content.length > 1) {
            leftPart.content[0].content[0].denomerator =
                Block.wrap(leftPart.content[0].content[0].denomerator);
        }
        if (leftPart.content[0].content[0].numerator.content.length > 1) {
            leftPart.content[0].content[0].numerator = Block.wrap(leftPart.content[0].content[0].numerator);
        }

        let inverted = false;
        for (let item of leftPart.content[0].content[0].denomerator.content[0].content) {
            if (item === mult) {
                inverted = true;
                continue;
            }

            rightPart.content[0].mul(item);
        }

        for (let item of leftPart.content[0].content[0].numerator.content[0].content) {
            if (item === mult) continue;

            rightPart.content[0].devide(item);
        }

        if (inverted) {
            rightPart.content[0].content[0].invert();
        }

        rightPart.content[0].simplify();
        rightPart.simplify();
        leftPart = Block.wrap(mult);
        leftPart.simplify();

        return new Formula([leftPart, rightPart]);
    };

    this.openBrackets = function(block, term) {
        let part = this._getActivePart(term).copy();

        let newTerms = [];
        block.content.forEach((item)=>{
            let newTerm = term.copy();
            newTerm.content.splice(newTerm.content.indexOf(block), 1);

            newTerm.mul(item);
            newTerms.push(newTerm);
        });

        for (let i=0; i<part.content.length; i++) {
            if (!part.content[i].content.includes(block)) continue;

            part.content.splice(i, 1, ...newTerms);
        }

        return this._copyWithModifiedPart(part, term);
    };


    this.substituteTerm = function(term, otherFormula) {
        let part = this._getActivePart(term).copy();
        for (let i=0; i<part.content.length; i++) {
            if (!part.content[i].isEqual(term)) continue;

            part.content.splice(i, 1, ...otherFormula.rightPart().copy().content);
            break;
        }

        return this._copyWithModifiedPart(part, term);
    };

    this.substituteMultiplier = function(mult, term, otherFormula) {
        let part = this._getActivePart(term).copy();

        let newTerm = term.copy();
        for (let i=0; i<newTerm.content.length; i++) {
            let item = newTerm.content[i];

            if (item == mult) {
                newTerm.content.splice(i, 1, otherFormula.rightPart());
                newTerm.removeExtraBlocks();
                break;
            }
            if (!(item instanceof Frac) || !(item.numerator.getMultipliers().includes(mult) ||
                    item.denomerator.getMultipliers().includes(mult))) continue;

            let frac = item.copy();
            let wrap = new Term([frac]);

            if ( frac.numerator.content[0].content.includes(mult)) {
                frac.numerator.content[0].content.splice(frac.numerator.content[0].content.indexOf(mult), 1);
                wrap.mul(otherFormula.rightPart());
            }

            if ( frac.denomerator.content[0].content.includes(mult)) {
                frac.denomerator.content[0].content.splice(frac.numerator.content[0].content.indexOf(mult), 1);
                wrap.devide(otherFormula.rightPart());
            }

            frac.denomerator.removeExtraBlocks();
            frac.numerator.removeExtraBlocks();

            newTerm.content.splice(i, 1, wrap.content[0]);
            if (wrap.sign == "-") newTerm.changeSign();
            break;
        }

        for (let i=0; i<part.content.length; i++) {
            if (!part.content[i].isEqual(term)) continue;

            part.content.splice(i, 1, newTerm);
            break;
        }

        return this._copyWithModifiedPart(part, term);
    };
}

Formula.fromHTML = function(elem) {
    prepareHTML(elem.lastChild);

    let equalityParts = [];

    for (let part of elem.lastChild.children) {
        if (part.innerHTML == "=") continue;

        equalityParts.push(Block.fromHTML(part));
    }

    let formula = new Formula(equalityParts);
    formula.HTMLElement = elem;
    formula.TeX = elem.firstChild.innerHTML;
    return formula;
};


