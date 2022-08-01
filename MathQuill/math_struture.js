function getMathStructure(elem) {
    if (elem.classList.contains(classNames.variable) || elem.tagName === "VAR") {
        return Variable.fromHTML(elem);
    } else if (elem.classList.contains(classNames.number)) {
        return Num.fromHTML(elem);
    } else if (elem.classList.contains(classNames.fraction)) {
        return Frac.fromHTML(elem);
    } else if (elem.classList.contains(classNames.function)) {
        return Func.fromHTML(elem);
    } else if (elem.firstChild.classList.contains(classNames.paren)) {
        return Block.fromHTML(elem.firstChild.nextElementSibling);
    } else if (elem.lastChild.classList.contains(classNames.sqrtContent) ||
        elem.firstChild.classList.contains(classNames.sqrtBase)) {
        return Sqrt.fromHTML(elem);
    } else if (elem.lastChild.classList.contains(classNames.indices)) {
        return SupSub.fromHTML(elem);
    } else throw new Error("Unknown structure");
}

function Frac(numerator, denomerator) {
    this.numerator = numerator; // [block]
    this.denomerator = denomerator; // [block]

    this.toTex = function() {
        return `\\frac{${this.numerator.toTex()}}{${this.denomerator.toTex()}}`;
    };

    this.isEqual = function(other) {
        if (!(other instanceof Frac)) return false;

        return this.numerator.isEqual(other.numerator) && this.denomerator.isEqual(other.denomerator);
    };

    this.invert = function() {
        [this.numerator, this.denomerator] = [this.denomerator, this.numerator];
    };

    this.copy = function() {
        return new Frac(this.numerator.copy(), this.denomerator.copy());
    };
}

Frac.fromHTML = function(elem) {
    let frac = new Frac(Block.fromHTML(childrenQuerySelector(elem, "." + classNames.numerator)),
        Block.fromHTML(childrenQuerySelector(elem, "." + classNames.denomerator)));

    frac.HTMLElement = elem;
    return frac;
};


function Sqrt(content, root = Block.wrap(new Num(2))) {
    this.root = root; // [block] or 2
    this.content = content; // [block]

    this.toTex = function() {
        return `\\sqrt${ this.root.toTex() === "2"? "": `[${this.root.toTex()}]` }{${this.content.toTex()}}`;
    };

    this.isEqual = function(other) {
        if (!(other instanceof Sqrt)) return false;

        return this.root.isEqual(other.root) && this.content.isEqual(other.content);
    };
}

Sqrt.fromHTML = function(elem) {
    let root = Block.wrap(new Num(2));

    if (elem.classList.contains(classNames.selectable)) {
        root = Block.fromHTML(elem.firstChild);
        elem = elem.lastChild;
    }

    sqrt = new Sqrt(Block.fromHTML(elem.lastChild), root);
    sqrt.HTMLElement = elem;
    return sqrt;
};


function SupSub(base, upperIndex = null, lowerIndex = null) {
    this.base = base;
    this.upperIndex = upperIndex;
    this.lowerIndex = lowerIndex;

    this.toTex = function() {
        let str = this.base.toTex();
        if (this.lowerIndex) {
            if (this.lowerIndex.toTex().length == 1) {
                str += `_${this.lowerIndex.toTex()}`;
            } else {
                str += `_{${this.lowerIndex.toTex()}}`;
            }
        }
        if (this.upperIndex) {
            if (this.upperIndex.toTex().length == 1) {
                str += `^${this.upperIndex.toTex()}`;
            } else {
                str += `^{${this.upperIndex.toTex()}}`;
            }
        }
        return str;
    };

    this.isEqual = function(other) {
        if (!(other instanceof SupSub)) return false;

        return this.lowerIndex.isEqual(other.lowerIndex) && this.upperIndex.isEqual(other.upperIndex) &&
            this.base.isEqual(other.base);
    };
}

SupSub.fromHTML = function(elem) {
    let sup = childrenQuerySelector(elem.lastChild, "." + classNames.upperIndex);
    let sub = childrenQuerySelector(elem.lastChild, "." + classNames.lowerIndex);

    let subsub = new SupSub(getMathStructure(elem.firstChild), sup ? Block.fromHTML(sup) : null,
        sub ? Block.fromHTML(sub) : null);
    subsub.HTMLElement = elem;
    return subsub;
};

// returns [base, power] of any structure
SupSub.getPower = function(structure) {
    if (structure instanceof SupSub) {
        return [structure.base, structure.upperIndex];
    }

    return [structure, Block.wrap(new Num(1))];
};


function Variable(name) {
    this.name = name; // [string]

    this.toTex = function() {
        return this.name;
    };

    this.isEqual = function(other) {
        if (!(other instanceof Variable)) return false;

        return this.name === other.name;
    };
}

Variable.fromHTML = function(elem) {
    let variable = new Variable(elem.innerText);
    variable.HTMLElement = elem;
    return variable;
};


function Func(name, content) {
    this.name = name; // function name like "log", "sin" ...
    this.content = content; // block

    this.toTex = function() {
        return `\\${this.name} ${this.content.toTex()}`;
    };

    this.isEqual = function(other) {
        if (!(other instanceof Func)) return false;

        return this.name === other.name && this.content.isEqual(other.content);
    };
}

Func.fromHTML = function(elem) {
    let func = new Func(elem.firstChild.innerText, getMathStructure(elem.lastChild));
    func.HTMLElement = elem;
    return func;
};


function Num(number) {
    this.value = Number(number);

    if (this.value < 0) {
        throw new Error("Number must be >= 0");
    }

    this.valueOf = function() {
        return this.value;
    };

    this.toTex = function() {
        return String(this.value);
    };

    this.isEqual = function(other) {
        if (!(other instanceof Num)) return false;

        return this.value === other.value;
    };
}

Num.fromHTML = function(elem) {
    let number = new Num(elem.innerText);
    number.HTMLElement = elem;
    return number;
};
