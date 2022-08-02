function InteractiveField(elem) {
    this.main = elem;
    this.formulas = [];

    this.active = null;

    this.main.addEventListener("click", (event)=>{
        if (event.target == this.main) {
            this.deleteActive();
        }
    });

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
            if (this.active && this.active.element == mult) {
                this.deleteActive();
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
                if (!this.active || this.active.term != term) {
                    event.clickDescription.element = term;
                    delete event.clickDescription.mult;
                }
            } else {
                event.clickDescription = {
                    element: term,
                };
            }
            event.clickDescription.term = term;

            if (event.clickDescription.element == term && this.active && this.active.element == term) {
                this.deleteActive();
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

            if (event.clickDescription.element == formula && this.active && this.active.element == formula) {
                this.deleteActive();
                return;
            }

            this.setActive(event.clickDescription);
        });
    };

    this.setActive = function(active) {
        if (this.active) {
            this.active.element.HTMLElement.style.borderStyle = "none";
        }

        if (active.element instanceof Formula) {
            active.element.HTMLElement.style.borderStyle = "dotted";
        } else if (active.element instanceof Term) {
            active.element.HTMLElement.style.borderStyle = "dashed";
        } else {
            active.element.HTMLElement.style.borderStyle = "solid";
        }

        this.active = active;
    };

    this.deleteActive = function() {
        if (this.active) {
            this.active.element.HTMLElement.style.borderStyle = "none";
        }

        this.active = null;
    };

    this.separateTerm = function() {
        if (!this.active || !(this.active.element instanceof Term)) return;

        let newFormula = this.active.formula.separateTerm(this.active.element);
        this.insertContent(createFormula(newFormula.toTex()));
    };

    this.separateMultiplier = function() {
        if (!this.active || this.active.element instanceof Term || this.active.element instanceof Formula) 
            return;

        let newFormula = this.active.formula.separateMultiplier(this.active.element, this.active.term);
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


