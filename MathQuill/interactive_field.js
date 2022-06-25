const activeElementTypes = {
    formula: 0,
    multiplier: 1,
    term: 2,
};


function InteractiveField(elem) {
    this.main = elem;
    this.activeFormula = null;
    this.activeElement = null;
    this.formulas = [];

    this.insertContent = function(content) {
        this.main.append(content);

        let formula = new Fomula(content, this);
        this.formulas.push(formula);

        this._makeHandlers(formula.equalityParts[0]);
        this._makeHandlers(formula.equalityParts[formula.equalityParts.length - 1]);

        content.addEventListener("click", (event)=>{
            this.activeFormula = formula;

            if (event.target === content) {
                this.setActiveElement(content, activeElementTypes.formula);
            }
        });
    };

    this._makeHandlers = function(equalityPart) {
        _makeTermHandlers = (block) => {
            for (let term of block.content) {
                _termHandler(term.HTMLElement);
            }
        };

        _makeMultiplierHandlers = (term) => {
            let numerator = term.numerator;
            let denomerator = term.denomerator;

            for (let item of numerator.content[0].content) {
                _multiplierHandler(item.HTMLElement);
            }
            for (let item of denomerator.content[0].content) {
                _multiplierHandler(item.HTMLElement);
            }
        };

        _multiplierHandler = (elem) => {
            elem.addEventListener("click", ()=>{
                this.setActiveElement(elem, activeElementTypes.multiplier);
            });
        };

        _termHandler = (elem) => {
            elem.addEventListener("click", ()=>{
                this.setActiveElement(elem, activeElementTypes.term);
            });
        };


        if (equalityPart.frac) {
            _makeMultiplierHandlers(equalityPart.frac);
        } else {
            _makeTermHandlers(equalityPart.block);
        }
    };

    this.setActiveElement = function(elem, type) {
        if (this.activeElement) {
            this.activeElement.style.borderStyle = "none";
        }

        if (type === activeElementTypes.multiplier) {
            elem.style.borderStyle = "solid";
        } else if (type === activeElementTypes.term) {
            elem.style.borderStyle = "dotted";
        } else if (type === activeElementTypes.formula) {
            elem.style.borderStyle = "solid";
        }

        this.activeElement = elem;
    };

    this.deleteActiveElement = function() {
        if (this.activeElement) {
            this.activeElement.style.borderStyle = "none";
        }

        this.activeElement = null;
    };
}


function Fomula(elem) {
    this.HTMLElement = elem.lastChild;
    this.TeX = elem.firstChild.innerHTML;
    this.equalityParts = [];
    this.activePart = null;

    prepareHTML(elem.lastChild);

    for (let part of elem.lastChild.children) {
        if (part.innerHTML == "=") continue;

        this.equalityParts.push(new EqualityPart(part));
    }
}


function EqualityPart(elem) {
    this.HTMLElement = elem;
    this.block = Block.fromHTML(elem);
    this.frac = null; // [Term] frac of equality part if it`s possible

    if (this.block.content.length == 1) {
        let termCopy = this.block.content[0].copy(); // copy of the only term of block;
        termCopy.transformToFrac();
        this.frac = termCopy.content[0];
    }
}


function prepareHTML(root) {
    let cursor = root.querySelector(".mq-cursor");
    if (cursor) cursor.parentElement.removeChild(cursor);

    makeEqualityParts(root);

    // mark digits
    mark(root, classNames.digit, ":not([class])", (elem) => !isNaN(elem.innerHTML) || elem.innerHTML==".");
    // mark breackers
    mark(root, classNames.breacker, "span", (elem) => ["+", "−"].includes(elem.innerHTML));
    // group digits to number
    groupByCondition(root, classNames.number, (el) => el.classList.contains(classNames.digit));
    // group letters to function
    groupByCondition(root, classNames.functionName, (el) => el.classList.contains(classNames.letters));
    // making variables
    groupByCondition(root, classNames.variable, 
        (el) => el.matches(`var:not([class="${classNames.letters}"])`), (el) => el.innerHTML == "′");

    // group function
    groupWithNextSibling(root, "." + classNames.functionName, classNames.function);
    // make sqrt group with base
    groupWithNextSibling(root, "." + classNames.sqrtBase, classNames.selectable);
    // make subsub group
    groupWithPreviousSibling(root, "." + classNames.indices, classNames.selectable);
    makeTermsGroup(root);
}
