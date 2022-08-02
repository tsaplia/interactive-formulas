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

const specialSymbols = {
    minus: {
        sym: "−",
        TeX: "-",
    },
    prime: {
        sym: "′",
        TeX: "'",
    },
};

const interactiveFieldFunctions = {
    t: "separateTerm",
    m: "separateMultiplier",
    o: "openBrackets",
};

function mark(root, className, selector, reducer) {
    let selected = root.querySelectorAll(selector);
    for (let elem of selected) {
        if (reducer(elem)) {
            elem.classList.add(className);
        }
    }
}

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

function _groupNext(startElement, groupName, condition) {
    let group = wrap(startElement, groupName);

    let next = group.nextElementSibling;
    while (next && condition(next)) {
        group.appendChild(next);
        next = group.nextElementSibling;
    }
    return group;
}

function groupWithNextSibling(root, selector, groupName) {
    for (let elem of root.querySelectorAll(selector)) {
        let group = wrap(elem, groupName);
        group.appendChild(group.nextElementSibling);
    }
}

function groupWithPreviousSibling(root, selector, groupName) {
    for (let elem of root.querySelectorAll(selector)) {
        let group = wrap(elem.previousElementSibling, groupName);
        group.appendChild(elem);
    }
}


function wrap(root, className = "") {
    let newGroup = document.createElement("span");
    newGroup.className = className;
    root.parentElement.insertBefore(newGroup, root);
    newGroup.appendChild(root);

    return newGroup;
}

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

function childrenQuerySelector(root, selector) {
    for (let child of root.children) {
        if (child.matches(selector)) {
            return child;
        }
    }

    return null;
}


function createFormula(latex) {
    let elem = document.createElement("div");
    elem.className = "formula";
    elem.innerText = latex;

    MQ.StaticMath(elem);
    return elem;
}


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


function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);

    while (b!=0) {
        a %= b;
        [a, b] = [b, a];
    }

    return a;
}


function addFractions(a, b) {
    if (!(a instanceof Array) && !a.size() == 2 && !(b instanceof Array) && !b.size() == 2) {
        throw new Error("Arguments should be Array of length 2");
    }

    let num = a[0]*b[1] + b[0]*a[1];
    let denom = b[1]*a[0];

    num /= gcd(num, denom);
    denom /= gcd(num, denom);

    if (denom<0) {
        num *= -1;
    }

    return [num, denom];
}


