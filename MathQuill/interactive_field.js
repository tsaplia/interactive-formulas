
function InteractiveField(elem){
    this.main  = elem;
    this.activeFormula = null;
    this.activeElem = null;

    this.insertContent = function(content){
        this.main.append(content);
    }
}

function prepareHTML(root){
    makeEqualityParts(root);
    let cursor = root.querySelector(".mq-cursor");
    if(cursor) cursor.parentElement.removeChild(cursor);
    
    root.mark(classNames.digit, ":not([class])", (elem) => !isNaN(elem.innerHTML)); //mark digits
    root.mark(classNames.breacker, "span", (elem) => ["+", "−"].includes(elem.innerHTML)); //mark breackers

    root.groupByCondition(classNames.number, (el) => el.classList.contains(classNames.digit)); //digits to number
    root.groupByCondition(classNames.functionName, (el) => el.classList.contains(classNames.letters)); //letters to function
    root.groupByCondition(classNames.variable, (el) => el.matches(`var:not([class="${classNames.letters}"])`), (el) => el.innerHTML == "′"); //making variables

    root.groupWithNextSibling("." + classNames.functionName, classNames.function); //group function
    root.groupWithNextSibling("." + classNames.sqrtBase, classNames.selectable); //make sqrt group with base
    root.groupWithPreviousSibling("." + classNames.indices, classNames.selectable); // make subsub group
    makeTermsGroup(root);
}


function makeHandlers(block, _nested=false){
    if(block.content.length == 1){
        let devideFractions = !_nested
        makeMultiplierHandlers(block.content[0], devideFractions);
    }else{
        if(!_nested)
            makeTermHandlers(block);    
        else
            multiplierHandler(block.HTMLElement);
    }
}

function makeTermHandlers(block){  
    for(let term of block.content)
        termHandler(term.HTMLElement);
}

function makeMultiplierHandlers(term, _devideFractions = true){
    for(let item of term.content){
        if(item instanceof Frac && _devideFractions){
            makeHandlers(item.numerator, true);
            makeHandlers(item.denomerator,true);
        }else{
            multiplierHandler(item.HTMLElement);
        }
    }
}

function termHandler(elem){
    elem.addEventListener("mouseenter", ()=>{
        elem.style.borderStyle = "dotted";
    });
    elem.addEventListener("mouseleave", ()=>{
        elem.style.borderStyle = "none";
    });
}

function multiplierHandler(elem){
    elem.addEventListener("mouseenter", ()=>{
        elem.style.borderStyle = "solid";
    });
    elem.addEventListener("mouseleave", ()=>{
        elem.style.borderStyle = "none";
    });
}
