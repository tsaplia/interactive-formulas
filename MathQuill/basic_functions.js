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

