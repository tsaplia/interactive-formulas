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


HTMLElement.prototype.wrap = function (className = '') {
    let newGroup = document.createElement("span");
    newGroup.className = className;
    this.parentElement.insertBefore(newGroup, this);
    newGroup.appendChild(this);

    return newGroup;
}

function makeTermsGroup(root){
    let blocks = root.querySelectorAll(`[mathquill-block-id], .${classNames.equalityPart}`);

    for(let block of blocks){
        let group = block.firstChild.wrap(classNames.term);
        
        let next = group.nextElementSibling;
        while(next){
            if(next.classList.contains(classNames.breacker)){
                group = next.wrap(classNames.term);
            }else{
                group.appendChild(next)
            }
            next = group.nextElementSibling;
        }
    }
}

function makeEqualityParts(root){
    let group = root.firstChild.wrap(classNames.equalityPart);   
    let next = group.nextElementSibling;
    while(next){
        if(next.innerHTML == "="){
            group = next.nextElementSibling.wrap(classNames.equalityPart);
        }else{
            group.appendChild(next);
        }
        next = group.nextElementSibling;
    }
}

HTMLElement.prototype.childrenQuerySelector = function (selector) {
    for (let child of this.children)
        if (child.matches(selector))
            return child;

    return null;
}
