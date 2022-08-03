class MathStructure {
    constructor() {
        if (this.constructor == MathStructure) {
            throw new Error(" Object of Abstract Class cannot be created");
        }
    }

    isEqual() {
        throw new Error("Abstract Method isEqual has no implementation");
    }

    toTex() {
        throw new Error("Abstract Method toTex has no implementation");
    }
}


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


class Frac extends MathStructure {
    constructor(numerator, denomerator) {
        super();
        this.numerator = numerator; // [block]
        this.denomerator = denomerator; // [block]
    }
    toTex() {
        return `\\frac{${this.numerator.toTex()}}{${this.denomerator.toTex()}}`;
    }

    isEqual(other) {
        if (!(other instanceof Frac)) return false;

        return this.numerator.isEqual(other.numerator) && this.denomerator.isEqual(other.denomerator);
    }

    invert() {
        [this.numerator, this.denomerator] = [this.denomerator, this.numerator];
    }

    copy() {
        return new Frac(this.numerator.copy(), this.denomerator.copy());
    }
}


class Sqrt extends MathStructure {
    constructor(content, root = Block.wrap(new Num(2))) {
        super();
        this.root = root; // [block] or 2
        this.content = content; // [block]
    }

    toTex() {
        return `\\sqrt${this.root.toTex() === "2" ? "" : `[${this.root.toTex()}]`}{${this.content.toTex()}}`;
    }

    isEqual(other) {
        if (!(other instanceof Sqrt)) return false;

        return this.root.isEqual(other.root) && this.content.isEqual(other.content);
    }
}


class SupSub extends MathStructure {
    constructor(base, upperIndex = null, lowerIndex = null) {
        super();
        this.base = base;
        this.upperIndex = upperIndex;
        this.lowerIndex = lowerIndex;
    }

    toTex() {
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
    }

    isEqual(other) {
        if (!(other instanceof SupSub)) false;

        return this.lowerIndex.isEqual(other.lowerIndex) && this.upperIndex.isEqual(other.upperIndex) &&
            this.base.isEqual(other.base);
    }

    // returns [base, power] of any structure
    static getPower(structure) {
        if (structure instanceof SupSub) {
            return [structure.base, structure.upperIndex];
        }

        return [structure, Block.wrap(new Num(1))];
    }
}


class Variable extends MathStructure {
    constructor(name) {
        super();
        this.name = name; // [string]
    }

    toTex() {
        return this.name;
    }

    isEqual(other) {
        if (!(other instanceof Variable)) return false;

        return this.name === other.name;
    }
}


class Func extends MathStructure {
    constructor(name, content) {
        super();
        this.name = name; // function name like "log", "sin" ...
        this.content = content; // block
    }

    toTex() {
        return `\\${this.name} ${this.content.toTex()}`;
    }

    isEqual(other) {
        if (!(other instanceof Func)) return false;

        return this.name === other.name && this.content.isEqual(other.content);
    }
}


class Num extends MathStructure {
    constructor(number) {
        super();
        this.value = Number(number);

        if (this.value < 0) {
            throw new Error("Number must be >= 0");
        }
    }

    toTex() {
        return String(this.value);
    }

    isEqual(other) {
        if (!(other instanceof Num)) return false;

        return this.value === other.value;
    }

    valueOf() {
        return this.value;
    }
}

