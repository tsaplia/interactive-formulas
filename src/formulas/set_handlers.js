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
function _mark(root, className, selector, reducer) {
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
function _groupFunctionParts(root) {
    let selected = root.querySelectorAll(".mi");
    for (let elem of selected) {
        if (!availibleMathFunc.includes(elem.innerHTML)) continue;

        let group = _wrap(elem, classNames.function);
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
function _wrap(root, className = "") {
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
function prepareHTML(root, formula) {
    let content = root.querySelector(".mrow");
    content.classList.add(classNames.formula);

    // mark "+" and "-"
    _mark(content, classNames.breacker, ".mo", (e) => ["+", "−"].includes(e.innerHTML));
    _groupFunctionParts(content);

    _prepareEqualityParts(content, formula);
    formulaHandler(formula, content);
};


/**
 * @param {HTMLElement} root
 * @param {Formula} formula
 */
function _prepareEqualityParts(root, formula) {
    let group = _wrap(root.firstChild, classNames.equalityPart);
    for (let i=0; i<formula.equalityParts.length; i++) {
        let next = group.nextElementSibling;
        while (next && next.innerHTML != "=") {
            group.appendChild(next);
            next = group.nextElementSibling;
        }
        _prepareTerms(group, formula.equalityParts[i]);

        if (next) group = _wrap(next.nextElementSibling, classNames.equalityPart);
    }
};


/**
 * @param {HTMLElement} root
 * @param {Block} block
 */
function _prepareTerms(root, block) {
    let group = _wrap(root.firstChild, classNames.term);
    for (let i=0; i<block.content.length; i++) {
        let next = group.nextElementSibling;
        while (next && !next.classList.contains(classNames.breacker)) {
            group.appendChild(next);
            next = group.nextElementSibling;
        }
        _prepareMults(group, block.content[i]);
        termHandler(block.content[i], group);

        if (next) group = _wrap(next, classNames.term);
    }
};


/**
 * @param {HTMLElement} root
 * @param {Term} term
 */
function _prepareMults(root, term) {
    for (let multInd=0, elemInd=0; multInd<term.content.length; multInd++, elemInd++) {
        while (root.children[elemInd].classList.contains("mo")) elemInd++;

        if (term.content[multInd] instanceof Frac) {
            let num = root.children[elemInd].firstChild.firstChild.firstChild;
            _prepareFraction(num, term.content[multInd].numerator);
            let denom = root.children[elemInd].firstChild.firstChild.nextSibling.firstChild;
            _prepareFraction(denom, term.content[multInd].denomerator);
        } else {
            multiplierHandler(term.content[multInd], root.children[elemInd]);
        }
    }
};


/**
 * @param {HTMLElement} root
 * @param {Term} term
 */
function _prepareFraction(root, term) {
    if (term.content.length==1) {
        multiplierHandler(term.content[0], root);
        return;
    }

    for (let multInd=0, elemInd=0; multInd<term.content.length; multInd++, elemInd++) {
        while (root.children[elemInd].classList.contains("mo")) elemInd++;

        multiplierHandler(term.content[multInd], root.children[elemInd]);
    }
};
