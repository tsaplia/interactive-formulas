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

        this._setHandlers(formula.equalityParts[0]);
        this._setHandlers(formula.equalityParts.slice(-1)[0]);
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
        if (this.active.length != 1 || this._getActiveType(this.active[0]) != this._activeTypes.term) return;

        let newFormula = this.active[0].formula.separateTerm(this.active[0].element);
        this.insertContent(createFormula(newFormula.toTex()));
    };

    this.separateMultiplier = function() {
        if (this.active.length != 1 || this._getActiveType(this.active[0]) != this._activeTypes.mult) return;

        let newFormula = this.active[0].formula.separateMultiplier(this.active[0].element, this.active[0].term);
        this.insertContent(createFormula(newFormula.toTex()));
    };
}


function Formula(equalityParts) {
    this.equalityParts = equalityParts;

    this.toTex = function() {
        let TeX = "";

        for (let part of this.equalityParts) {
            TeX += (TeX ? "=" : "" )+ part.toTex();
        }

        return TeX;
    };

    this.separateTerm = function(term) {
        let activePart;
        let passivePart;

        if (this.equalityParts[0].content.includes(term)) {
            activePart = this.equalityParts[0];
            passivePart = this.equalityParts.slice(-1)[0];
        } else if (this.equalityParts.slice(-1)[0].content.includes(term)) {
            activePart = this.equalityParts.slice(-1)[0];
            passivePart = this.equalityParts[0];
        } else {
            throw new Error("Term is not from this formula");
        }

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
            leftPart.content[0].content[0].denomerator = Block.wrap(leftPart.content[0].content[0].denomerator);
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


