function Term(content, sign = "+") {
    this.sign = sign; // plus(+) or minus(-)
    this.content = content; // array of structures like Variable, Funk, Frac...
}


Term.prototype.toTex = function() {
    let str = "";
    for (let i = 0; i < this.content.length; i++) {
        if (!isNaN(this.content[i].toTex()[0]) && i > 0) {
            str += "\\cdot ";
        }
        if (this.content[i] instanceof Block) {
            str += `\\left(${this.content[i].toTex()}\\right)`;
        } else {
            str += this.content[i].toTex();
        }
    }
    console.assert(this.content.length, "Empty term content");
    return str;
};


Term.prototype.copy = function() {
    return new Term([...this.content], this.sign);
};


Term.prototype.isEqual = function(other) {
    if (this.sign != other.sign || !(other instanceof Term) ||this.content.length != other.content.length) {
        return false;
    }

    for (let i = 0; i < this.content.length; i++) {
        if (this.content[i] != other.content[i] && !this.content[i].isEqual(other.content[i])) return false;
    }

    return true;
};


Term.prototype.isSame = function(other) {
    if (!(other instanceof Term)) return false;

    let thisProto = this._getComparativeProto();
    let otherProto = other._getComparativeProto();

    return thisProto.isEqual(otherProto);
};


Term.prototype._getComparativeProto = function() {
    let proto = new Term([...this.content]);

    proto.transformToFrac();
    proto.deleteNumbersDeep();
    proto.content[0].numerator.content[0]._sort();
    proto.content[0].denomerator.content[0]._sort();

    return proto;
};


Term.prototype.simplify = function() {
    this.removeExtraBlocks();
    this._removeFractions();
    this._createPowers();
    this._convertNegativePowers();

    if (!this._isFraction()) {
        this._removeExtraPowers();
    } else {
        this.content[0].numerator.content[0]._removeExtraPowers();
        this.content[0].denomerator.content[0]._removeExtraPowers();
    }

    this.mergeNumbers();

    if (this._isFraction()) {
        this.content[0].numerator.removeExtraBlocks();
        this.content[0].denomerator.removeExtraBlocks();

        if (this.content[0].denomerator.toTex()=="1") {
            this.content = [this.content[0].numerator];
        }
    }

    this.removeExtraBlocks();
};


Term.prototype._removeFractions = function() {
    for (let i=0; i<this.content.length; i++) {
        let item = this.content[i];

        if (!(item instanceof Frac)) continue;

        this.content.splice(i, 1, item.numerator);

        if (item.denomerator.content.length > 1) {
            this.content.push(new SupSub(item.denomerator, upperIndex = Block.wrap(new Num(1), "-")));
            continue;
        }

        item.denomerator.content[0].removeExtraBlocks();
        item.denomerator.content[0].content.forEach((elem)=>{
            let newStruct;
            if (elem instanceof SupSub) {
                newStruct = new SupSub(elem.base, elem.upperIndex.copy());
                newStruct.upperIndex.changeSignes();
            } else {
                newStruct = new SupSub(elem, Block.wrap(new Num(1), "-"));
            }
            this.content.push(newStruct);
        });
    }
    this.removeExtraBlocks();
};


Term.prototype._createPowers = function() {
    this._sort();

    for (let i=0; i < this.content.length - 1; i++) {
        let currrentBase; let nextBase; let currentPow; let nextPow;

        [currrentBase, currentPow] = SupSub.getPower(this.content[i]);
        [nextBase, nextPow] = SupSub.getPower(this.content[i+1]);

        if ( ! currrentBase.isEqual(nextBase)) continue;

        let sumPow = currentPow.copy();
        sumPow.add(nextPow);
        sumPow.simplify();

        this.content.splice(i, 2, new SupSub(currrentBase, sumPow));
        i--;
    }
};


Term.prototype._removeExtraPowers = function() {
    for (let i = 0; i < this.content.length; i++) {
        if (!(this.content[i] instanceof SupSub)) continue;

        if (this.content[i].upperIndex.toTex() == "1") {
            this.content.splice(i, 1, this.content[i].base);
        } else if (this.content[i].upperIndex.toTex()=="0" || this.content[i].base.toTex()=="1") {
            this.content.splice(i, 1, new Num(1));
        }
    }
};


Term.prototype._convertNegativePowers = function() {
    let denomerator = new Term([]);
    let numerator = new Term([]);

    for (let item of this.content) {
        if (item instanceof SupSub && item.upperIndex.content[0].sign == "-") {
            let newPower = item.upperIndex.copy();
            newPower.changeSignes();
            denomerator.content.push(new SupSub(item.base, newPower));
        } else {
            numerator.content.push(item);
        }
    }

    if (!numerator.content.length) {
        numerator.content.push(new Num(1));
    }

    if (denomerator.content.length > 0) {
        this.content = [new Frac(new Block([numerator]), new Block([denomerator]))];
    } else {
        this.content = numerator.content;
    }
};


Term.prototype._sort = function() {
    this.content.sort( (a, b) => {
        return a.toTex() < b.toTex() ? -1: 1;
    });
};


Term.prototype.deleteNumbers = function() {
    this.removeExtraBlocks();

    let prod = 1;

    for (let i=0; i<this.content.length; i++) {
        if (this.content[i] instanceof Num) {
            prod *= this.content[i].value;
            this.content.splice(i, 1);
            i--;
        }
    }

    return prod;
};


Term.prototype.deleteNumbersDeep = function() {
    this.removeExtraBlocks();

    let denomProd = 1;
    let numProd = 1;

    for (let i=0; i<this.content.length; i++) {
        if (this.content[i] instanceof Num) {
            numProd *= this.content[i].value;
            this.content.splice(i, 1);
            i--;
        }
        if (!(this.content[i] instanceof Frac)) continue;

        this.content[i] = this.content[i].copy();
        if (this.content[i].numerator.content.length == 1) {
            numProd *= this.content[i].numerator.content[0].deleteNumbers();
        }
        if (this.content[i].numerator.content.length == 1) {
            denomProd *= this.content[i].denomerator.content[0].deleteNumbers();
        }
    }

    return [numProd, denomProd];
};


Term.prototype.mergeNumbers = function() {
    let coef = this.deleteNumbersDeep();
    this.insertCoef(coef[0] / gcd(...coef), coef[1] / gcd(...coef));
    this.emptyContentCheck();
};


Term.prototype.insertCoef = function(numProd, denomProd) {
    if (denomProd == 1 && numProd == 1) return;

    if (this._isFraction()) {
        if (numProd != 1) {
            this.content[0].numerator.content[0].content.unshift(new Num(numProd));
        }
        if (denomProd != 1) {
            this.content[0].denomerator.content[0].content.unshift(new Num(denomProd));
        }
    } else {
        if (denomProd == 1) {
            this.content.unshift(new Num(numProd));
        } else {
            this.content.unshift(new Frac( Block.wrap(new Num(numProd)), Block.wrap(new Num(denomProd))));
        }
    }
};


Term.prototype.getRatio = function() {
    return this.copy().deleteNumbersDeep();
};


Term.prototype.removeExtraBlocks = function(start = 0, end = this.content.length) {
    let modified = false;
    for (let i = start; i < end; i ++) {
        let mult = this.content[i];
        if (!(mult instanceof Block)) continue;

        if (mult.content.length == 1) {
            this.content.splice(this.content.indexOf(mult), 1, ...mult.content[0].content);
            if (mult.content[0].sign == "-") this.changeSign();
            modified = true;
        }
    }

    return modified;
};


Term.prototype.mul = function(...items) {
    if (this._isFraction()) {
        this._fractionMul(...items);
        return;
    }

    for (let item of items) {
        if (item instanceof Term) {
            this.content.push(...item.content);

            if (item.sign == "-") this.changeSign();
        } else {
            this.content.push(item);
        }
    }
};


Term.prototype._fractionMul = function(...items) {
    let numerator = this.content[0].numerator;
    let denomerator = this.content[0].denomerator;

    for (let item of items) {
        if (item instanceof Term) {
            if (item.sign == "-") {
                this.changeSign();
            }
            this._fractionMul(...item.content);
        } else if (item instanceof Frac) {
            numerator.content[0].content.push(item.numerator);
            denomerator.content[0].content.push(item.denomerator);
        } else {
            numerator.content[0].content.push(item);
        }
    }

    numerator.content[0].removeExtraBlocks();
    denomerator.content[0].removeExtraBlocks();
};


Term.prototype.devide = function(...items) {
    let wasFrac = this._isFraction();
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

    if ((!wasFrac && denomerator.toTex() === "1") || denomerator.content[0].content.length == 0) {
        this.content = numerator.content[0];
    }
};


Term.prototype.changeSign = function() {
    this.sign = this.sign=="+" ? "-": "+";
};


Term.prototype.allMultipliers = function() {
    let multipliers = [];

    for (let item of this.content) {
        if (!(item instanceof Frac)) {
            multipliers.push(item);
            continue;
        }

        multipliers.push(...item.numerator.getMultipliers(), ...item.denomerator.getMultipliers());
    }

    return multipliers;
};


Term.prototype.transformToFrac = function() {
    if (this._isFraction()) return;

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

    this.content = [new Frac(numerator, denomerator)];
};


Term.prototype.emptyContentCheck = function() {
    if (this._isFraction()) {
        if (!this.content[0].numerator.content[0].content.length) {
            this.content[0].numerator.content[0].content.push(new Num(1));
        }
        if (!this.content[0].denomerator.content[0].content.length) {
            this.content[0].denomerator.content[0].content.push(new Num(1));
        }
    } else {
        if (!this.content.length) {
            this.content.push(new Num(1));
        }
    }
};


Term.prototype._isFraction = function() {
    return this.content.length == 1 && this.content[0] instanceof Frac;
};

