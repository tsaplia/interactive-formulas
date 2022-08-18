const classNames = {
    digit: "digit",
    number: "digit-group",
    letters: "mq-operator-name",
    function: "function",
    functionName: "mq-operator-name-group",
    fraction: "mq-fraction",
    numerator: "mq-numerator",
    denomerator: "mq-denominator",
    paren: "mq-paren",
    operator: "mq-binary-operator",
    sqrtContent: "mq-sqrt-stem",
    sqrtBase: "mq-nthroot",
    selectable: "select-group",
    variable: "variable",
    indices: "mq-supsub",
    upperIndex: "mq-sup",
    lowerIndex: "mq-sub",
    breacker: "breacker",
    vector: "mq-vector-prefix",
    term: "term",
    equalityPart: "equality-part",
};

/**
 * @param {HTMLElement} root 
 */
function prepareHTML(root) {
    let cursor = root.querySelector(".mq-cursor");
    if (cursor) cursor.parentElement.removeChild(cursor);

    makeEqualityParts(root);

    // mark digits
    mark(root, classNames.digit, ":not([class])", (elem) => !isNaN(elem.innerHTML) || elem.innerHTML==".");
    // mark breackers
    mark(root, classNames.breacker, "span", (el) => ["+", specialSymbols.minus.sym].includes(el.innerHTML));
    // group digits to number
    groupByCondition(root, classNames.number, (el) => el.classList.contains(classNames.digit));
    // group letters to function
    groupByCondition(root, classNames.functionName, (el) => el.classList.contains(classNames.letters));
    // making variables
    groupByCondition(root, classNames.variable,
        (el) => el.matches(`var:not([class="${classNames.letters}"])`),
        (el) => el.innerHTML == specialSymbols.prime.sym);

    // group function
    groupWithNextSibling(root, "." + classNames.functionName, classNames.function);
    // make sqrt group with base
    groupWithNextSibling(root, "." + classNames.sqrtBase, classNames.selectable);
    // make subsub group
    groupWithPreviousSibling(root, "." + classNames.indices, classNames.selectable);
    makeTermsGroup(root);
}


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
 * @param {string} groupName 
 * @param {Function} startCondition 
 * @param {Function} continueCondition 
 */
function groupByCondition(root, groupName, startCondition, continueCondition = startCondition) {
    let current = root.firstChild;
    while (current) {
        if (current.childElementCount >= 1) {
            groupByCondition(current, groupName, startCondition, continueCondition);
        } else if (startCondition(current)) {
            current = _groupNext(current, groupName, continueCondition);
        }

        current = current.nextElementSibling;
    }
}

/**
 * @param {HTMLElement} startElement 
 * @param {string} groupName 
 * @param {Function} condition 
 * @returns {HTMLSpanElement}
 */
function _groupNext(startElement, groupName, condition) {
    let group = wrap(startElement, groupName);

    let next = group.nextElementSibling;
    while (next && condition(next)) {
        group.appendChild(next);
        next = group.nextElementSibling;
    }
    return group;
}


/**
 * @param {HTMLElement} root 
 * @param {string} selector 
 * @param {string} groupName 
 */
function groupWithNextSibling(root, selector, groupName) {
    for (let elem of root.querySelectorAll(selector)) {
        let group = wrap(elem, groupName);
        group.appendChild(group.nextElementSibling);
    }
}


/**
 * @param {HTMLElement} root 
 * @param {string} selector 
 * @param {string} groupName 
 */
function groupWithPreviousSibling(root, selector, groupName) {
    for (let elem of root.querySelectorAll(selector)) {
        let group = wrap(elem.previousElementSibling, groupName);
        group.appendChild(elem);
    }
}


/**
 * @param {HTMLElement} root 
 * @param {string} className 
 * @returns {HTMLSpanElement}
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
 */
function makeTermsGroup(root) {
    let blocks = root.querySelectorAll(`[mathquill-block-id], .${classNames.equalityPart}`);

    for (let block of blocks) {
        let group = wrap(block.firstChild, classNames.term);
        let next = group.nextElementSibling;

        while (next) {
            if (next.classList.contains(classNames.breacker)) {
                group = wrap(next, classNames.term);
            } else {
                group.appendChild(next);
            }

            next = group.nextElementSibling;
        }
    }
}


/**
 * @param {HTMLElement} root 
 */
function makeEqualityParts(root) {
    let group = wrap(root.firstChild, classNames.equalityPart);
    let next = group.nextElementSibling;
    while (next) {
        if (next.innerHTML == "=") {
            group = wrap(next.nextElementSibling, classNames.equalityPart);
        } else {
            group.appendChild(next);
        }
        next = group.nextElementSibling;
    }
}


/**
 * @param {HTMLElement} root 
 * @param {string} selector 
 * @returns {HTMLElement?}
 */
function childrenQuerySelector(root, selector) {
    for (let child of root.children) {
        if (child.matches(selector)) {
            return child;
        }
    }

    return null;
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


Block.fromHTML = function(elem) {
    let content = [];

    for (let child of elem.children) {
        content.push(Term.fromHTML(child));
    }

    let block = new Block(content);
    block.HTMLElement = elem;
    return block;
};


Term.fromHTML = function(elem) {
    let content = [];
    let sign = "+";

    for (let child of elem.children) {
        if (child.classList.contains(classNames.breacker)) {
            sign = child.innerHTML.replace(specialSymbols.minus.sym, "-");
            continue;
        }

        if (child.classList.contains(classNames.operator)) continue;

        content.push(getMathStructure(child));
    }

    let term = new Term(content, sign);
    term.HTMLElement = elem;
    return term;
};


Frac.fromHTML = function(elem) {
    let num_block = childrenQuerySelector(elem, "." + classNames.numerator);
    let denom_block = childrenQuerySelector(elem, "." + classNames.denomerator);

    let numerator = num_block.childElementCount > 1 ? 
        new Term([Block.fromHTML(num_block)]) : Term.fromHTML(num_block.firstChild);
    let denomerator = denom_block.childElementCount > 1 ?
        new Term([Block.fromHTML(denom_block)]) : Term.fromHTML(denom_block.firstChild)

    let frac = new Frac(numerator, denomerator);

    frac.HTMLElement = elem;
    return frac;
};


Sqrt.fromHTML = function(elem) {
    let root = Block.wrap(new Num(2));

    if (elem.classList.contains(classNames.selectable)) {
        root = Block.fromHTML(elem.firstChild);
        elem = elem.lastChild;
    }

    let sqrt = new Sqrt(Block.fromHTML(elem.lastChild), root);
    sqrt.HTMLElement = elem;
    return sqrt;
};


SupSub.fromHTML = function(elem) {
    let sup = childrenQuerySelector(elem.lastChild, "." + classNames.upperIndex);
    let sub = childrenQuerySelector(elem.lastChild, "." + classNames.lowerIndex);

    let subsub = new SupSub(getMathStructure(elem.firstChild), sup ? Block.fromHTML(sup) : null,
        sub ? Block.fromHTML(sub) : null);
    subsub.HTMLElement = elem;
    return subsub;
};


Variable.fromHTML = function(elem) {
    let variable = new Variable(elem.innerText);
    variable.HTMLElement = elem;
    return variable;
};


Func.fromHTML = function(elem) {
    let func = new Func(elem.firstChild.innerText, getMathStructure(elem.lastChild));
    func.HTMLElement = elem;
    return func;
};


Num.fromHTML = function(elem) {
    let number = new Num(elem.innerText);
    number.HTMLElement = elem;
    return number;
};

