function Block(content) {
    this.content = content; // arrey of terms

    this.changeSignes = function() {
        this.content = this.content.map((term) => term.copy());
        this.content.forEach((term) => term.changeSign());
    };

    this.removeExtraBlocks = function() {
        for (let term of this.content) {
            if (term.content.length == 1 && term.content[0] instanceof Block && term.sign == "+") {
                this.content.splice(this.content.indexOf(term), 1, ...term.content[0].content);
            }
        }
    };

    this.add = function(...items) {
        for (let item of items) {
            if (item instanceof Term) {
                this.content.push(item);
            } else if (item instanceof Block) {
                this.content.push(...item.content);
            } else {
                throw new Error(`Can\`t add ${item.constructor.name} to Block`);
            }
        }
    };

    this.remove = function(...terms) {
        for (term of terms) {
            if (!this.content.contains(term)) continue;

            this.content.splice(this.content.indexOf(term), 1);
        }
    };

    this.toTex = function() {
        let str = "";
        for (let ind = 0; ind < this.content.length; ind++) {
            if (ind != 0 || this.content[ind].sign != "+") {
                str += this.content[ind].sign;
            }

            str += this.content[ind].toTex();
        }

        for (let symbol of Object.values(specialSymbols)) {
            str.replace(symbol.sym, symbol.TeX);
        }

        return str;
    };

    this.isEqual = function(other) {
        if (!(other instanceof Block) || this.content.length != other.content.length) return false;

        for (let ind = 0; ind < this.content.length; ind++) {
            if (!this.content[ind].isEqual(other.content[ind])) return false;
        }

        return true;
    };

    this.copy = function() {
        return new Block(this.content.map((term)=>term.copy()));
    };
}

Block.fromHTML = function(elem) {
    let content = [];

    for (let child of elem.children) {
        content.push(Term.fromHTML(child));
    }

    let block = new Block(content);
    block.HTMLElement = elem;
    return block;
};

Block.wrap = function wrap(struct) {
    if (struct instanceof Term) {
        return new Block([struct]);
    }

    return new Block([new Term([struct])]);
};


function Term(content, sign = "+") {
    this.sign = sign; // plus(+) or minus(-)
    this.content = content; // array of structures like Variable, Funk, Frac...

    this.changeSign = function() {
        this.sign = this.sign=="+" ? "-": "+";
    };

    this.allMultipliers = function() {
        let multipliers = [];

        getBlockMultipliers = (block) => {
            let multipliers = [];

            if (block.content.length == 1) {
                block.content[0].content.forEach((elem) => {
                    multipliers.push(elem);
                });
            } else {
                multipliers.push(block);
            }

            return multipliers;
        };

        for (let item of this.content) {
            if (!(item instanceof Frac)) {
                multipliers.push(item);
                continue;
            }

            multipliers.push(...getBlockMultipliers(item.numerator),
                ...getBlockMultipliers(item.denomerator));
        }

        return multipliers;
    };

    this.removeExtraBlocks = function(start = 0, end = this.content.length) {
        for (let ind = start; ind < end; ind ++) {
            let term = this.content[ind];
            if (!(term instanceof Block)) continue;

            if (term.content.length == 1) {
                this.content.splice(this.content.indexOf(term), 1, ...term.content[0].content);
            }
        }
    };

    this.mul = function(...items) {
        for (let item of items) {
            if (item instanceof Term) {
                this.content.push(...item.content);

                if (item.sign == "-") this.changeSign();
            } else {
                this.content.push(item);
            }
        }
    };

    this.devide = function(...items) {
        this.transformToFrac();

        let numerator = this.content[0].numerator;
        let denomerator = this.content[0].denomerator;

        for (let item of items) {
            if (item instanceof Term) {
                if (item.sign == "-") {
                    this.changeSign();
                }
                this.devide(...item.content);
            } else if (item instanceof Frac) {
                denomerator.content[0].content.push(item.numerator);
                numerator.content[0].content.push(item.denomerator);
            } else {
                denomerator.content[0].content.push(item);
            }
        }

        numerator.content[0].removeExtraBlocks();
        denomerator.content[0].removeExtraBlocks();

        if (!this.toTex() || this.toTex()==="1") {
            this.content = numerator.content[0];
        }
    };

    this.transformToFrac = function() {
        let denomerator = new Block([new Term([])]);
        let numerator = new Block([new Term([])]);

        for (let item of this.content) {
            if (item instanceof Frac) {
                denomerator.content[0].content.push(item.denomerator);
                numerator.content[0].content.push(item.numerator);
            } else {
                numerator.content[0].content.push(item);
            }
        }
        numerator.content[0].removeExtraBlocks();
        denomerator.content[0].removeExtraBlocks();

        if (!denomerator.content[0].content.length) {
            denomerator.content[0].content.push(new Num(1));
        }

        this.content = [new Frac(numerator, denomerator)];
    };

    this.toTex = function() {
        let str = "";
        for (let ind = 0; ind < this.content.length; ind++) {
            if (this.content[ind] instanceof Num && ind > 0) {
                str += "\\cdot ";
            }
            if (this.content[ind] instanceof Block) {
                str += `\\left(${this.content[ind].toTex()}\\right)`;
            } else {
                str += this.content[ind].toTex();
            }
        }
        return str;
    };

    this.isEqual = function(other) {
        if (this.sign != other.sign || !(other instanceof Term) ||
            this.content.length != other.content.length) return false;

        for (let ind = 0; ind < this.content.length; ind++) {
            if (!this.content[ind].isEqual(other.content[ind])) return false;
        }

        return true;
    };

    this.copy = function() {
        return new Term(this.content, this.sign);
    };
}

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
