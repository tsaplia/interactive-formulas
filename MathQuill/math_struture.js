function Block(content) {
    this.content = content // arrey of terms

    this.toTex = function(){
        let str = ''; 
        for(let ind in this.content){
            if(ind != 0 || this.content[ind].sign != "+") 
                str += this.content[ind].sign;
            
            str += content[ind].toTex();
        }
        return str;
    }
}

Block.fromHTML = function (elem) {
    let content = [];
    for (let child of elem.children)
            content.push(Term.fromHTML(child));

    let block = new Block(content);
    block.HTMLElement = elem;
    return block;
}


function Term(content, sign = "+") {
    this.sign = sign; //plus(+) or minus(-)
    this.content = content; // array of structures like Variable, Funk, Frac...

    this.toTex = function(){
        let str = '';
        for(let ind in this.content){
            if(this.content[ind] instanceof Number){
                if(ind > 0) 
                    str += '\\cdot ';
                str += this.content[ind];
            }
            else if(this.content[ind] instanceof Block)
                str += `\\left(${this.content[ind].toTex()}\\right)`;
            else
                str += this.content[ind].toTex();
    
        }
        return str;
    }
}

Term.fromHTML = function(elem){
    let content = [];
    let sign = "+";

    for(let child of elem.children){
        if(child.classList.contains(classNames.breacker))
            sign = child.innerHTML;
            
        if (child.classList.contains(classNames.operator)) continue;
        
        content.push(getMathStructure(child));
    }

    let term =  new Term(content, sign);
    term.HTMLElement = elem;
    return term;
}

function getMathStructure(elem){
    if (elem.classList.contains(classNames.variable) || elem.tagName === "VAR")
        return Variable.fromHTML(elem);
        
    else if (elem.classList.contains(classNames.number))
        return Number.fromHTML(elem);

    else if (elem.classList.contains(classNames.fraction))
        return Frac.fromHTML(elem);

    else if (elem.classList.contains(classNames.function))
        return Func.fromHTML(elem);

    else if (elem.firstChild.classList.contains(classNames.paren))
        return Block.fromHTML(elem.firstChild.nextElementSibling);

    else if (elem.lastChild.classList.contains(classNames.sqrtContent) || 
                elem.firstChild.classList.contains(classNames.sqrtBase))
        return Sqrt.fromHTML(elem);

    else if (elem.lastChild.classList.contains(classNames.indices))
        return SupSub.fromHTML(elem);
    
    else throw "Unknown structure"
}


function Frac(numerator, denomerator) {
    this.numerator = numerator; //[block]
    this.denomerator = denomerator; //[block]

    this.toTex = function(){
        return `\\frac{${this.numerator.toTex()}}{${this.denomerator.toTex()}}`;
    }
}

Frac.fromHTML = function (elem) {
    let frac = new Frac(Block.fromHTML(elem.childrenQuerySelector("."+classNames.numerator)),
        Block.fromHTML(elem.childrenQuerySelector("." + classNames.denomerator)));

    frac.HTMLElement = elem;
    return frac;
}

function Sqrt(content, root = 2) {
    this.root = root; //[number]
    this.content = content; //[block]
    
    this.toTex = function(){
        return `\\sqrt${ this.root !== 2? `[${this.root.toTex()}]`:"" }{${this.content.toTex()}}`
    }
}

Sqrt.fromHTML = function (elem) {
    let root = 2;

    if (elem.classList.contains(classNames.selectable)) {
        root = Block.fromHTML(elem.firstChild);
        elem = elem.lastChild;
    }

    sqrt = new Sqrt(Block.fromHTML(elem.lastChild), root);
    sqrt.HTMLElement = elem;
    return sqrt;
}

function SupSub(base, upperIndex = null, lowerIndex = null) {
    this.base = base;
    this.upperIndex = upperIndex;
    this.lowerIndex = lowerIndex;

    this.toTex = function(){
        let str = this.base instanceof Number ? this.base+" ": this.base.toTex();
        if(this.lowerIndex){
            if(this.lowerIndex.toTex().length == 1)
                str += `_${this.lowerIndex.toTex()}`;      
            else
                str += `_{${this.lowerIndex.toTex()}}`;
        }
        if(this.upperIndex){
            if(this.upperIndex.toTex().length == 1)
                str += `^${this.upperIndex.toTex()}`;      
            else
                str += `^{${this.upperIndex.toTex()}}`;
        }
        return str;
    }    
}

SupSub.fromHTML = function (elem) {
    let sup = elem.lastChild.childrenQuerySelector("." + classNames.upperIndex);
    let sub = elem.lastChild.childrenQuerySelector("." + classNames.lowerIndex);

    let subsub = new SupSub(getMathStructure(elem.firstChild), sup ? Block.fromHTML(sup) : null, 
            sub ? Block.fromHTML(sub) : null);
    subsub.HTMLElement = elem;
    return subsub;

}

function Variable(name) {
    this.name = name; //[string]
    
    this.toTex = function(){
        return this.name;
    }
}

Variable.fromHTML = function (elem) {
    let variable = new Variable(elem.innerText);
    variable.HTMLElement = elem;
    return variable;
}

function Func(name, content) {
    this.name = name; //function name like "log", "sin" ...
    this.content = content; // block

    this.toTex = function(){
        return `\\${this.name} ${this.content.toTex()}`;
    }
}

Func.fromHTML = function (elem) {
    let func = new Func(elem.firstChild.innerText, getMathStructure(elem.lastChild));
    func.HTMLElement = elem;
    return func;
}

Number.fromHTML = function(elem){
    let number = new Number(elem.innerText);
    number.HTMLElement = elem;
    return number;
}
