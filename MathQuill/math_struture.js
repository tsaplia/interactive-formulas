class MathStructure {
    constructor() {
        if (this.constructor == MathStructure) {
            throw new Error(" Object of Abstract Class cannot be created");
        }
    }

    /**
     * @return {boolean}
     */
    isEqual() {
        throw new Error("Abstract Method isEqual has no implementation");
    }

    /**
     * @return {string}
     */
    toTex() {
        throw new Error("Abstract Method toTex has no implementation");
    }
}

class Frac extends MathStructure {
    constructor(numerator, denomerator) {
        super();

        /** @type {Term} */
        this.numerator = numerator;

        /** @type {Term} */
        this.denomerator = denomerator;
    }
    toTex() {
        let num = new Block([this.numerator]).toTex();
        let denom = new Block([this.denomerator]).toTex();

        if (this.numerator.content.length == 1 && this.numerator.sign == "+" &&
            this.numerator.content[0] instanceof Block) {
            num = this.numerator.content[0].toTex();
        }
        if (this.denomerator.content.length == 1 && this.denomerator.sign == "+" &&
            this.denomerator.content[0] instanceof Block) {
            denom = this.denomerator.content[0].toTex();
        }

        return `\\frac{${num}}{${denom}}`;
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

        /** @type {Block} */
        this.root = root;

        /** @type {MathStructure} */
        this.content = content; //
    }

    toTex() {
        let content = this.content.toTex();

        return `\\sqrt${this.root.toTex() === "2" ? "" : `[${this.root.toTex()}]`}{${content}}`;
    }

    isEqual(other) {
        if (!(other instanceof Sqrt)) return false;

        return this.root.isEqual(other.root) && this.content.isEqual(other.content);
    }
}


class Power extends MathStructure {
    constructor(base, exponent = null) {
        super();

        /** @type {MathStructure} */
        this.base = base;

        /** @type {Block} */
        this.exponent = exponent;
    }

    toTex() {
        let str = this.base.toTex();
        if (this.base instanceof Block) {
            str = "\\left("+str+"\\right)";
        }

        if (this.exponent) {
            if (this.exponent.toTex().length == 1) {
                str += `^${this.exponent.toTex()}`;
            } else {
                str += `^{${this.exponent.toTex()}}`;
            }
        }
        return str;
    }

    isEqual(other) {
        if (!(other instanceof Power)) false;

        return ((!this.exponent && !other.exponent) || this.exponent.isEqual(other.exponent)) &&
            this.base.isEqual(other.base);
    }

    /**
     * @param {MathStructure} structure
     * @return {Array<Term | Block>}
     */
    static getPower(structure) {
        if (structure instanceof Power) {
            return [structure.base, structure.exponent];
        }

        return [structure, Block.wrap(new Num(1))];
    }
}


class Variable extends MathStructure {
    constructor(name, index = null, vector = false, primeCount = 0) {
        super();

        /** @type {string} */
        this.name = name;

        /** @type {string} */
        this.index = index;

        /** @type {boolean} */
        this.vector = vector;

        /** @type {number} */
        this.primeCount = primeCount;
    }

    toTex() {
        let TeX = this.name;
        for(let i=0; i<this.primeCount; i++) TeX+="'";
        if(this.index) {
            TeX += "_" + (this.index.length == 1 ? this.index: `{${this.index}}`)
        }
        if(this.vector){
            TeX = `\\vec{${TeX}}`
        }
        return TeX
    }

    isEqual(other) {
        if (!(other instanceof Variable)) return false;

        return this.name === other.name;
    }
}


class Func extends MathStructure {
    constructor(name, content) {
        super();

        /** @type {string} */
        this.name = name; // function name like "log", "sin" ...

        /** @type {Block} */
        this.content = content; // function argument
    }

    toTex() {
        return `\\${this.name}\\left(${this.content.toTex()}\\right)`;
    }

    isEqual(other) {
        if (!(other instanceof Func)) return false;

        return this.name === other.name && this.content.isEqual(other.content);
    }
}


class Num extends MathStructure {
    constructor(number) {
        super();

        /** @type {number} */
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

