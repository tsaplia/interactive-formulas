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
    vector: "mq-vector-prefix"
}

HTMLElement.prototype.mark = function (className, selector, reducer) {
    let selected = this.querySelectorAll(selector);
    for (let elem of selected)
        if (reducer(elem))
            elem.classList.add(className);
}

HTMLElement.prototype.groupByCondition = function (groupName, startCondition, continueCondition = startCondition) {
    let current = this.firstChild;
    while (current) {
        if (current.childElementCount >= 1)
            current.groupByCondition(groupName, startCondition, continueCondition);
        else if (startCondition(current))
            current = _groupNext(current, groupName, continueCondition);

        current = current.nextElementSibling;
    }
}

function _groupNext(startElement, groupName, condition) {
    let group = startElement.wrap(groupName);

    let next = group.nextElementSibling;
    while (next && condition(next)) {
        group.appendChild(next);
        next = group.nextElementSibling;
    }
    return group;
}

HTMLElement.prototype.groupWithNextSibling = function (selector, groupName) {
    for (let elem of this.querySelectorAll(selector)) {
        let group = elem.wrap(groupName);
        group.appendChild(group.nextElementSibling);
    }
}

HTMLElement.prototype.groupWithPreviousSibling = function (selector, groupName) {
    for (let elem of this.querySelectorAll(selector)) {
        let group = elem.previousElementSibling.wrap(groupName);
        group.appendChild(elem);
    }
}


HTMLElement.prototype.wrap = function (className) {
    let newGroup = document.createElement("span");
    newGroup.className = className;
    this.parentElement.insertBefore(newGroup, this);
    newGroup.appendChild(this);

    return newGroup;
}


function Block(content) {
    this.content = content // arrey of terms
}

Block.fromHTML = function (elem) {
    let content = [];
    let start = 0;
    for (let index = 1; index < elem.childElementCount; index++)
        if (elem.children[index].classList.contains(classNames.breacker)){
            content.push(Term.fromHTML(elem.children[start], elem.children[index - 1]));
            start = index++;
        }

    content.push(Term.fromHTML(elem.children[start], elem.children[elem.children.length - 1]));

    return new Block(content);
}

function Term(content, sign = "+") {
    this.sign = sign; //plus(+) or minus(-)
    this.content = content; // array of structures like Var, Funk, Frac...

}

Term.fromHTML = function (first, last) {
    let content = [];
    let sign = "+";
    if (first.classList.contains(classNames.breacker)) {
        sign = first.innerHTML;
        first = first.nextElementSibling;
    }

    while (first) {
        if (first.classList.contains("mq-binary-operator")) {
            first = first.nextElementSibling;
            continue;
        }

        if (first.classList.contains(classNames.variable) || first.tagName === "VAR")
            content.push(Var.fromHTML(first));
        
        else if (first.classList.contains(classNames.number))
            content.push(Number(first.innerText));

        else if (first.classList.contains(classNames.fraction))
            content.push(Frac.fromHTML(first));

        else if (first.classList.contains(classNames.function))
            content.push(Func.fromHTML(first));

        else if (first.firstChild.classList.contains(classNames.paren))
            content.push(Block.fromHTML(first.firstChild.nextElementSibling));

        else if (first.lastChild.classList.contains(classNames.sqrtContent) || 
                    first.firstChild.classList.contains(classNames.sqrtBase))
            content.push(Sqrt.fromHTML(first));

        else if (first.lastChild.classList.contains(classNames.indices))
            content.push(SupSub.fromHTML(first))

        if (first === last) break;
        first = first.nextElementSibling;
    }
    return new Term(content, sign);
}

function Frac(numerator, denomerator) {
    this.numerator = numerator; //[block]
    this.denomerator = denomerator; //[block]
}

Frac.fromHTML = function (elem) {
    return new Frac(Block.fromHTML(elem.childrenQuerySelector("."+classNames.numerator)),
        Block.fromHTML(elem.childrenQuerySelector("." + classNames.denomerator)));
}

function Sqrt(content, root = 2) {
    this.root = root; //[number]
    this.content = content; //[block]
}

Sqrt.fromHTML = function (elem) {
    let root = 2;

    if (elem.classList.contains(classNames.selectable)) {
        root = Block.fromHTML(elem.firstChild);
        elem = elem.lastChild;
    }

    return new Sqrt(Block.fromHTML(elem.lastChild), root);
}

function SupSub(base, upperIndex = null, lowerIndex = null) {
    this.base = base;
    this.upperIndex = upperIndex;
    this.lowerIndex = lowerIndex;
}

SupSub.fromHTML = function (elem) {
    let sup = elem.lastChild.childrenQuerySelector("." + classNames.upperIndex);
    let sub = elem.lastChild.childrenQuerySelector("." + classNames.lowerIndex);

    return new SupSub(Term.fromHTML(elem.firstChild), sup ? Block.fromHTML(sup) : null, 
            sub ? Block.fromHTML(sub) : null);

}

function Var(name) {
    this.name = name; //[string]
}

Var.fromHTML = function (elem) {
    return new Var(elem.innerText);

}

function Func(name, content) {
    this.name = name; //function name like "log", "sin" ...
    this.content = content; // block
}

Func.fromHTML = function (elem) {
    return new Func(elem.firstChild.innerText, Term.fromHTML(elem.lastChild,elem.lastChild));
}

HTMLElement.prototype.childrenQuerySelector = function (selector) {
    for (let child of this.children)
        if (child.matches(selector))
            return child;

    return null;
}
