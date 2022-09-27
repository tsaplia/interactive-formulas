const classNames = {
    breacker: "in-pm",
    function: "in-function",
    term: "in-term",
    formula: "in-formula",
    equalityPart: "in-equality-part",
};


/**
 * @param {HTMLElement} root
 * @param {string} className
 * @param {string} selector
 * @param {Function} reducer
 */
function mark(root, className, selector, reducer) {
    let selected = root.querySelectorAll(selector);
    for (let elem of selected) {
        if (reducer(elem)) {
            elem.classList.add(className);
        }
    }
}

/**
 * @param {HTMLElement} root
 */
function groupFunctionParts(root) {
    let selected = root.querySelectorAll(".mi");
    for (let elem of selected) {
        if (!availibleMathFunc.includes(elem.innerHTML)) continue;

        let group = wrap(elem, classNames.function);
        if (!group.nextElementSibling.innerHTML) {
            group.append(group.nextElementSibling);
        }
        group.appendChild(group.nextElementSibling);
    }
}


/**
 * @param {HTMLElement} root
 * @param {string} className
 * @return {HTMLSpanElement}
 */
function wrap(root, className = "") {
    let newGroup = document.createElement("span");
    newGroup.className = className;
    root.parentElement.insertBefore(newGroup, root);
    newGroup.appendChild(root);

    return newGroup;
}


/**
 * @param {HTMLElement} root
 * @param {Formula} formula
 */
InteractiveField.prototype.prepareHTML = function(root, formula) {
    let content = root.querySelector(".mrow");
    content.classList.add(classNames.formula);

    // mark "+" and "-"
    mark(content, classNames.breacker, ".mo", (e) => ["+", "−"].includes(e.innerHTML));
    groupFunctionParts(content);

    this.prepareEqualityParts(content, formula);
    this.formulaHandler(formula, content);
};


/**
 * @param {HTMLElement} root
 * @param {Formula} formula
 */
InteractiveField.prototype.prepareEqualityParts = function(root, formula) {
    let group = wrap(root.firstChild, classNames.equalityPart);
    for (let i=0; i<formula.equalityParts.length; i++) {
        let next = group.nextElementSibling;
        while (next && next.innerHTML != "=") {
            group.appendChild(next);
            next = group.nextElementSibling;
        }
        this.prepareTerms(group, formula.equalityParts[i]);

        if (next) group = wrap(next.nextElementSibling, classNames.equalityPart);
    }
};


/**
 * @param {HTMLElement} root
 * @param {Block} block
 */
InteractiveField.prototype.prepareTerms = function(root, block) {
    let group = wrap(root.firstChild, classNames.term);
    for (let i=0; i<block.content.length; i++) {
        let next = group.nextElementSibling;
        while (next && !next.classList.contains(classNames.breacker)) {
            group.appendChild(next);
            next = group.nextElementSibling;
        }
        this.prepareMults(group, block.content[i]);
        this.termHandler(block.content[i], group);

        if (next) group = wrap(next, classNames.term);
    }
};


/**
 * @param {HTMLElement} root
 * @param {Term} term
 */
InteractiveField.prototype.prepareMults = function(root, term) {
    for (let multInd=0, elemInd=0; multInd<term.content.length; multInd++, elemInd++) {
        while (root.children[elemInd].classList.contains("mo")) elemInd++;

        if (term.content[multInd] instanceof Frac) {
            let num = root.children[elemInd].firstChild.firstChild.firstChild;
            this.prepareFraction(num, term.content[multInd].numerator);
            let denom = root.children[elemInd].firstChild.firstChild.nextSibling.firstChild;
            this.prepareFraction(denom, term.content[multInd].denominator);
        } else {
            this.multiplierHandler(term.content[multInd], root.children[elemInd]);
        }
    }
};


/**
 * @param {HTMLElement} root
 * @param {Term} term
 */
InteractiveField.prototype.prepareFraction = function(root, term) {
    if (term.content.length==1) {
        this.multiplierHandler(term.content[0], root);
        return;
    }

    for (let multInd=0, elemInd=0; multInd<term.content.length; multInd++, elemInd++) {
        while (root.children[elemInd].classList.contains("mo")) elemInd++;

        this.multiplierHandler(term.content[multInd], root.children[elemInd]);
    }
};
