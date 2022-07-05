const activeElementTypes = {
    formula: 0,
    multiplier: 1,
    term: 2,
};


function InteractiveField(elem) {
    this.main = elem;
    this.formulas = [];

    this.activeFormula = null;
    this.activeElement = null;
    this.activeElementType = null;

    this.insertContent = function(content) {
        this.main.append(content);

        let formula = Formula.fromHTML(content);
        this.formulas.push(formula);

        this._makeHandlers(formula.equalityParts[0]);
        this._makeHandlers(formula.equalityParts.slice(-1)[0]);

        content.addEventListener("click", (event)=>{
            this.activeFormula = formula;

            if (event.target === content) {
                this.setActiveElement(formula, activeElementTypes.formula);
            }
        });
    };

    this._makeHandlers = function(block) {
        multiplierHandler = (elem) => {
            elem.HTMLElement.addEventListener("dblclick", ()=>{
                this.setActiveElement(elem, activeElementTypes.multiplier);
            });
        };

        termHandler = (elem) => {
            elem.HTMLElement.addEventListener("click", ()=>{
                this.setActiveElement(elem, activeElementTypes.term);
            });
        };


        for (let term of block.content) {
            termHandler(term);
            term.allMultipliers().forEach((elem) => {
                multiplierHandler(elem);
            });
        }
    };

    this.setActiveElement = function(elem, type) {
        if (this.activeElement) {
            this.activeElement.HTMLElement.style.borderStyle = "none";
        }

        if (type === activeElementTypes.multiplier) {
            elem.HTMLElement.style.borderStyle = "solid";
        } else if (type === activeElementTypes.term) {
            elem.HTMLElement.style.borderStyle = "dotted";
        } else if (type === activeElementTypes.formula) {
            elem.HTMLElement.style.borderStyle = "solid";
        }

        this.activeElement = elem;
        this.activeElementType = type;
    };

    this.deleteActiveElement = function() {
        if (this.activeElement) {
            this.activeElement.HTMLElement.style.borderStyle = "none";
        }

        this.activeElement = null;
    };

    this.separateTerm = function() {
        if (!this.activeElement || this.activeElementType != activeElementTypes.term) return;

        let newFormula = this.activeFormula.separateTerm(this.activeElement);
        this.insertContent(createFormula(newFormula.toTex()));
    };

    this.separateMultiplier = function() {
        if (!this.activeElement || this.activeElementType != activeElementTypes.multiplier) return;

        let newFormula = this.activeFormula.separateMultiplier(this.activeElement);
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

        if (term.sign=="-") {
            leftPart.changeSignes();
            rightPart.changeSignes();
        }

        return new Formula([leftPart, rightPart]);
    };

    this.separateMultiplier = function(mult) {
        let formula;
        for (let term of this.equalityParts.slice(-1)[0].content.concat(this.equalityParts[0].content)) {
            if (term.allMultipliers().includes(mult)) {
                formula = this.separateTerm(term);
                break;
            }
        }

        formula.equalityParts[0].content[0].transformToFrac();
        if (formula.equalityParts[1].content.length == 1) {
            formula.equalityParts[1].content[0].transformToFrac();
        } else {
            formula.equalityParts[1] = Block.wrap(new Frac(
                Block.wrap(formula.equalityParts[1]), Block.wrap(new Num(1))));
        }

        for (let item of formula.equalityParts[0].content[0].content[0].numerator.content[0].content) {
            if (item === mult) continue;

            formula.equalityParts[1].content[0].content[0].denomerator.content[0].mul(item);
        }

        let inverted = false;
        for (let item of formula.equalityParts[0].content[0].content[0].denomerator.content[0].content) {
            if (item === mult) {
                inverted = true;
                continue;
            }

            formula.equalityParts[1].content[0].content[0].numerator.content[0].mul(item);
        }

        if (inverted) {
            formula.equalityParts[1].content[0].content[0].invert();
        }

        formula.equalityParts[0] = Block.wrap(mult);
        return formula;
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
    formula.TeX = elem.lastChild.innerHTML;
    return formula;
};


