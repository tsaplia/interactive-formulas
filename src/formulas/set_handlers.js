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
 * get all character from element and children
 * @param {HTMLElement} elem
 * @return {string}
 */
function _getInnerText(elem) {
    if (elem.children.length == 0) {
        let content = window.getComputedStyle(elem, "before").content;
        return content == "none" ? "" : content.slice(1, -1);
    }
    let text = "";
    for (let child of elem.children) {
        text += _getInnerText(child);
    }
    return text;
}

/**
 * @param {HTMLElement} root
 */
function _groupFunctionParts(root) {
    let selected = root.querySelectorAll("mjx-mi");
    for (let elem of selected) {
        if (!availibleMathFunc.includes(_getInnerText(elem))) continue;

        let group = _wrap(elem, classNames.function);
        if (!_getInnerText(group.nextElementSibling)) {
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
    let content = root.querySelector("mjx-math");
    content.classList.add(classNames.formula);

    // mark "+" and "-"
    _mark(content, classNames.breacker, "mjx-mo", (e) => ["+", "−"].includes(_getInnerText(e)));
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
    for (let i = 0; i < formula.equalityParts.length; i++) {
        let next = group.nextElementSibling;
        while (next && _getInnerText(next) != "=") {
            group.appendChild(next);
            next = group.nextElementSibling;
        }
        if (i==0 || i==formula.equalityParts.length-1) prepareTerms(group, formula.equalityParts[i]);

        if (next) group = _wrap(next.nextElementSibling, classNames.equalityPart);
    }
};


/**
 * @param {HTMLElement} root
 * @param {Block} block
 */
function prepareTerms(root, block) {
    let group = _wrap(root.firstChild, classNames.term);
    for (let i = 0; i < block.content.length; i++) {
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
 * remove groupping from term element
 * @param {HTMLElement} root
 */
function deleteTermGroups(root) {
    let group = root.firstElementChild;
    while (group) {
        if (!group.classList.contains(classNames.term)) continue;

        while (group.childNodes.length) {
            root.insertBefore(group.firstChild, group);
        }
        group = group.nextElementSibling;
    }
    root.querySelectorAll(`.${classNames.term}`).forEach((el)=>{
        root.removeChild(el);
    });
}


/**
 * @param {HTMLElement} root
 * @param {Term} term
 */
function _prepareMults(root, term) {
    for (let multInd = 0, elemInd = 0; multInd < term.content.length; multInd++, elemInd++) {
        while (root.children[elemInd].tagName=="MJX-MO") elemInd++;

        if (term.content[multInd] instanceof Frac) {
            let num = root.children[elemInd].querySelector("mjx-num mjx-mrow") ||
                 root.children[elemInd].querySelector("mjx-num");
            _prepareFraction(num, term.content[multInd].numerator);
            let denom = root.children[elemInd].querySelector("mjx-den mjx-mrow") ||
                root.children[elemInd].querySelector("mjx-den");
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
    if (term.content.length == 1) {
        multiplierHandler(term.content[0], root);
        // sprtial hanler
        return;
    }

    for (let multInd = 0, elemInd = 0; multInd < term.content.length; multInd++, elemInd++) {
        while (root.children[elemInd].tagName=="MJX-MO") elemInd++;

        multiplierHandler(term.content[multInd], root.children[elemInd]);
    }
};
