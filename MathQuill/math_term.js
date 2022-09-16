class Term extends MathStructure {
    constructor(content, sign = "+") {
        super();
        /** @type {string} */
        this.sign = sign; // plus(+) or minus(-)

        /** @type {Array<MathStructure>} */
        this.content = content; // inner multipliers
    }

    toTex() {
        let str = "";
        for (let i = 0; i < this.content.length; i++) {
            if (!isNaN(this.content[i].toTex()[0]) && !(this.content[i] instanceof Block) && i > 0) {
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
    }

    /** @return {Term} copy of term without copying multipliers*/
    copy() {
        return new Term([...this.content], this.sign);
    }

    isEqual(other) {
        if (this.sign != other.sign || !(other instanceof Term) ||
            this.content.length != other.content.length) return false;

        for (let i = 0; i < this.content.length; i++) {
            if (this.content[i] != other.content[i] && !this.content[i].isEqual(other.content[i])) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param {MathStructure} other
     * @return {boolean}
     */
    isSame(other) {
        if (!(other instanceof Term)) return false;

        let thisProto = this._getComparativeProto();
        let otherProto = other._getComparativeProto();

        return thisProto.isEqual(otherProto);
    }

    /**
     * @return {Term}
     */
    _getComparativeProto() {
        let proto = new Term([...this.content]);

        proto.transformToFrac();
        proto.deleteNumbersDeep();
        proto.content[0].numerator._sort();
        proto.content[0].denomerator._sort();

        return proto;
    }

    simplify() {
        this.removeExtraBlocks();
        this._removeFractions();
        this._createPowers();
        this._convertNegativePowers();

        if (!this._isFraction()) {
            this._removeExtraPowers();
        } else {
            this.content[0].numerator._removeExtraPowers();
            this.content[0].denomerator._removeExtraPowers();
        }

        this.mergeNumbers();

        if (this._isFraction()) {
            this.content[0].numerator.removeExtraBlocks();
            this.content[0].denomerator.removeExtraBlocks();

            this._removeEmptyDenom();
        }

        this.removeExtraBlocks();
    }

    _removeFractions() {
        for (let i = 0; i < this.content.length; i++) {
            let item = this.content[i];

            if (!(item instanceof Frac)) continue;

            this.content.splice(i, 1, ...item.numerator.content);

            item.denomerator.removeExtraBlocks();
            item.denomerator.content.forEach((elem) => {
                let newStruct;
                if (elem instanceof Power) {
                    newStruct = new Power(elem.base, elem.exponent.copy());
                    newStruct.exponent.changeSignes();
                } else {
                    newStruct = new Power(elem, Block.wrap(new Num(1), "-"));
                }
                this.content.push(newStruct);
            });

            if (item.numerator.sign == "-") this.changeSign();
            if (item.denomerator.sign == "-") this.changeSign();
        }
        this.removeExtraBlocks();
    }

    _createPowers() {
        this._sort();

        for (let i = 0; i < this.content.length - 1; i++) {
            let currrentBase; let nextBase; let currentPow; let nextPow;

            [currrentBase, currentPow] = Power.getPower(this.content[i]);
            [nextBase, nextPow] = Power.getPower(this.content[i + 1]);

            if (!currrentBase.isEqual(nextBase)) continue;

            let sumPow = currentPow.copy();
            sumPow.add(nextPow);
            sumPow.simplify();

            this.content.splice(i, 2, new Power(currrentBase, sumPow));
            i--;
        }
    }

    _removeExtraPowers() {
        for (let i = 0; i < this.content.length; i++) {
            if (!(this.content[i] instanceof Power)) continue;

            if (this.content[i].exponent.toTex() == "1") {
                this.content.splice(i, 1, this.content[i].base);
            } else if (this.content[i].exponent.toTex() == "0" || this.content[i].base.toTex() == "1") {
                this.content.splice(i, 1, new Num(1));
            }
        }
    }

    _convertNegativePowers() {
        let denomerator = new Term([]);
        let numerator = new Term([]);

        for (let item of this.content) {
            if (item instanceof Power && item.exponent.content[0].sign == "-") {
                let newPower = item.exponent.copy();
                newPower.changeSignes();
                denomerator.content.push(new Power(item.base, newPower));
            } else {
                numerator.content.push(item);
            }
        }

        if (!numerator.content.length) {
            numerator.content.push(new Num(1));
        }

        if (denomerator.content.length > 0) {
            this.content = [new Frac(numerator, denomerator)];
        } else {
            this.content = numerator.content;
        }
    }

    _sort() {
        this.content.sort((a, b) => {
            return a.toTex() < b.toTex() ? -1 : 1;
        });
    }

    /**
     * @return {number}
     */
    deleteNumbers() {
        this.removeExtraBlocks();

        let prod = 1;

        for (let i = 0; i < this.content.length; i++) {
            if (this.content[i] instanceof Num) {
                prod *= this.content[i].value;
                this.content.splice(i, 1);
                i--;
            }
        }

        return prod;
    }

    /**
     * @return {Array<number>}
     */
    deleteNumbersDeep() {
        this.removeExtraBlocks();

        let denomProd = 1;
        let numProd = 1;

        for (let i = 0; i < this.content.length; i++) {
            if (this.content[i] instanceof Num) {
                numProd *= this.content[i].value;
                this.content.splice(i, 1);
                i--;
                continue;
            }
            if (!(this.content[i] instanceof Frac)) continue;

            this.content[i] = this.content[i].copy();
            numProd *= this.content[i].numerator.deleteNumbers();
            denomProd *= this.content[i].denomerator.deleteNumbers();
        }

        return [numProd, denomProd];
    }

    mergeNumbers() {
        let coef = this.deleteNumbersDeep();
        this.insertCoef(coef[0] / gcd(...coef), coef[1] / gcd(...coef));
        this.emptyContentCheck();
    }

    /**
     * @param {number} numProd
     * @param {number} denomProd
     */
    insertCoef(numProd, denomProd) {
        if (denomProd == 1 && numProd == 1) return;

        if (this._isFraction()) {
            if (numProd != 1) {
                this.content[0].numerator.content.unshift(new Num(numProd));
            }
            if (denomProd != 1) {
                this.content[0].denomerator.content.unshift(new Num(denomProd));
            }
        } else {
            if (denomProd == 1) {
                this.content.unshift(new Num(numProd));
            } else {
                this.content.unshift(new Frac( new Term([new Num(numProd)]), new Term([new Num(denomProd)])));
            }
        }
    }

    /**
     * @return {Array<number>}
     */
    getRatio() {
        return this.copy().deleteNumbersDeep();
    }

    /**
     * @param {number} start
     * @param {number} end
     * @return {boolean}
     */
    removeExtraBlocks(start = 0, end = this.content.length) {
        let modified = false;
        for (let i = start; i < end; i++) {
            let mult = this.content[i];
            if (!(mult instanceof Block) || mult.content.length != 1) continue;

            this.content.splice(this.content.indexOf(mult), 1, ...mult.content[0].content);
            if (mult.content[0].sign == "-") this.changeSign();
            modified = true;
        }

        return modified;
    }

    _removeEmptyDenom() {
        for (let i=0; i<this.content.length; i++) {
            if (!(this.content[i] instanceof Frac) ||
                !this.content[i].denomerator.isEqual(new Term([new Num(1)]))) continue;

            if (this.content[i].denomerator.sign == "-") this.changeSign();
            let insertedMults = this.content[i].numerator.content;
            this.content.splice(i, 1, ...insertedMults);
            i += insertedMults.length - 1;
        }
    }

    /**
     * @param  {...MathStructure} items
     */
    mul(...items) {
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
    }

    /**
     * @param  {...MathStructure} items
     */
    _fractionMul(...items) {
        this.content[0] = this.content[0].copy();

        for (let item of items) {
            if (item instanceof Term) {
                if (item.sign == "-") {
                    this.changeSign();
                }
                this._fractionMul(...item.content);
            } else if (item instanceof Frac) {
                this.mul(item.numerator);
                this.devide(item.denomerator);
            } else {
                this.content[0].numerator.content.push(item);
            }
        }
    }

    /**
     * @param  {...MathStructure} items
     */
    devide(...items) {
        let wasFrac = this._isFraction();
        if (wasFrac) {
            this.content[0] = this.content[0].copy();
        } else {
            this.transformToFrac();
        }

        for (let item of items) {
            if (item instanceof Term) {
                if (item.sign == "-") {
                    this.changeSign();
                }
                this.devide(...item.content);
            } else if (item instanceof Frac) {
                this.devide(item.numerator);
                this.mul(item.denomerator);
            } else {
                this.content[0].denomerator.content.push(item);
            }
        }

        if (!wasFrac) {
            this._removeEmptyDenom();
        }
    }

    changeSign() {
        this.sign = this.sign == "+" ? "-" : "+";
    }

    /**
     * @return {Array<MathStructure>}
     */
    allMultipliers() {
        let multipliers = [];

        for (let item of this.content) {
            if (item instanceof Frac) {
                multipliers.push(...item.numerator.content, ...item.denomerator.content);
            } else {
                multipliers.push(item);
            }
        }

        return multipliers;
    }

    transformToFrac() {
        if (this._isFraction()) return;

        let denomerator = new Term([]);
        let numerator = new Term([]);

        for (let item of this.content) {
            if (item instanceof Frac) {
                denomerator.content.push(...item.denomerator.content);
                numerator.content.push(...item.numerator.content);

                if (item.numerator.sign == "-") this.changeSign();
                if (item.denomerator.sign == "-") this.changeSign();
            } else {
                numerator.content.push(item);
            }
        }

        this.content = [new Frac(numerator, denomerator)];
    }

    emptyContentCheck() {
        if (!this.content.length) {
            this.content.push(new Num(1));
            return;
        }
        for (let i=0; i<this.content.length; i++) {
            if (!(this.content[i] instanceof Frac)) continue;

            if (!this.content[i].numerator.content.length) {
                this.content[i].numerator.content.push(new Num(1));
            }
            if (!this.content[i].denomerator.content.length) {
                this.content[i].denomerator.content.push(new Num(1));
            }
        }
    }

    /**
     * @return {boolean}
     */
    _isFraction() {
        return this.content.length == 1 && this.content[0] instanceof Frac;
    }
}

