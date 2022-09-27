class Formula extends MathStructure {
    constructor(equalityParts) {
        super();
        /** @type {Array<Block>} */
        this.equalityParts = equalityParts;
    }

    toTex() {
        let TeX = "";

        for (let part of this.equalityParts) {
            TeX += (TeX ? "=" : "") + part.toTex();
        }

        return TeX;
    }

    copy() {
        return new Formula(this.equalityParts.map((part) => part.copy()));
    }

    /**
     * @return {Block}
     */
    leftPart() {
        return this.equalityParts[0];
    }

    /**
     * @return {Block}
     */
    rightPart() {
        return this.equalityParts.slice(-1)[0];
    }

    /**
     *
     * @param {Term?} [term]
     * @return {boolean}
     */
    isSeparatedTerm(term) {
        let f = this.leftPart().content.length == 1 && this.leftPart().content[0].sign == "+";
        if (term && this.leftPart().content[0] != term) {
            f = false;
        }
        return f;
    }

    /**
     * @param {MathStructure?} [mult]
     * @return {boolean}
     */
    isSeparatedMultiplier(mult) {
        let f = this.isSeparatedTerm() && this.leftPart().content[0].allMultipliers().length == 1 &&
            !(this.leftPart().content[0].content[0] instanceof Block);
        if (mult && this.leftPart().content[0].content[0] != mult) {
            f = false;
        }
        return f;
    }

    /**
     * @param {Term} term
     * @return {Block}
     */
    _getActivePart(term) {
        if (this.leftPart().content.includes(term)) return this.leftPart();

        if (this.rightPart().content.includes(term)) {
            return this.rightPart();
        }

        throw new Error("Term is not from this formula");
    }

    /**
     * @param {Term} term
     * @return {Block}
     */
    _getPassivePart(term) {
        if (this.leftPart().content.includes(term)) {
            return this.rightPart();
        }
        if (this.rightPart().content.includes(term)) {
            return this.leftPart();
        }
        throw new Error();
    }

    /**
     * @param {Block} part
     * @param {Term} term
     * @return {Formula}
     */
    _copyWithModifiedPart(part, term) {
        if (this._getActivePart(term) == this.rightPart()) {
            return new Formula([this.leftPart(), part]);
        }

        return new Formula([part, this.rightPart().copy()]);
    }

    /**
     * @param {Term} term
     * @return {Formula}
     */
    separateTerm(term) {
        let activePart = this._getActivePart(term);
        let passivePart = this._getPassivePart(term);

        let leftPart = Block.wrap(term.copy());
        let rightPart = passivePart.copy();

        for (let item of activePart.content) {
            if (item == term) {
                continue;
            }

            let newItem = item.copy();
            newItem.changeSign();
            rightPart.add(newItem);
        }

        if (term.sign == "-") {
            leftPart.changeSignes();
            rightPart.changeSignes();
        }

        rightPart.simplify();

        return new Formula([leftPart, rightPart]);
    }

    /**
     * @param {MathStructure} mult
     * @param {Term} term
     * @return {Formula}
     */
    separateMultiplier(mult, term) {
        let leftPart;
        let rightPart;
        [leftPart, rightPart] = this.separateTerm(term).equalityParts;

        if (rightPart.content.length > 1) {
            rightPart = Block.wrap(rightPart);
        }

        leftPart.content[0].transformToFrac();

        let inverted = false;
        for (let item of leftPart.content[0].content[0].denomerator.content) {
            if (item === mult) {
                inverted = true;
                continue;
            }

            rightPart.content[0].mul(item);
        }
        if (leftPart.content[0].content[0].denomerator.sign == "-") rightPart.content[0].changeSign();

        for (let item of leftPart.content[0].content[0].numerator.content) {
            if (item === mult) {
                continue;
            }

            rightPart.content[0].devide(item);
        }
        if (leftPart.content[0].content[0].numerator.sign == "-") rightPart.content[0].changeSign();

        if (inverted) {
            rightPart.content[0].content[0].invert();
        }

        rightPart.content[0].simplify();
        rightPart.simplify();
        leftPart = Block.wrap(mult);
        leftPart.simplify();

        return new Formula([leftPart, rightPart]);
    }

    /**
     * @param {Block} block
     * @param {Term} term
     * @return {Formula}
     */
    openBrackets(block, term) {
        let part = this._getActivePart(term).copy();

        let newTerms = [];
        block.content.forEach((item) => {
            let newTerm = term.copy();
            newTerm.content.splice(newTerm.content.indexOf(block), 1);

            newTerm.mul(item);
            newTerms.push(newTerm);
        });

        for (let i = 0; i < part.content.length; i++) {
            if (!part.content[i].content.includes(block)) {
                continue;
            }

            part.content.splice(i, 1, ...newTerms);
        }
        part.simplify();

        return this._copyWithModifiedPart(part, term);
    }

    /**
     * @param {Term} term
     * @param {Formula} otherFormula
     * @return {Formula}
     */
    substituteTerm(term, otherFormula) {
        let part = this._getActivePart(term).copy();
        for (let i = 0; i < part.content.length; i++) {
            if (!part.content[i].isEqual(term)) {
                continue;
            }

            part.content.splice(i, 1, ...otherFormula.rightPart().copy().content);
            break;
        }
        part.simplify();

        return this._copyWithModifiedPart(part, term);
    }

    /**
     * @param {MathStructure} mult
     * @param {Term} term
     * @param {Formula} otherFormula //formula withseparated multiplier
     * @return {Formula}
     */
    substituteMultiplier(mult, term, otherFormula) {
        let part = this._getActivePart(term).copy();

        let newTerm = term.copy();
        let inserted = otherFormula.rightPart().content.length == 1 ?
            otherFormula.rightPart().content[0]: new Term([otherFormula.rightPart()]);

        for (let i = 0; i < newTerm.content.length; i++) {
            let item = newTerm.content[i];
            // for not fraction mult
            if (item == mult) {
                newTerm.content.splice(i, 1, ...inserted.content);
                newTerm.removeExtraBlocks();
                if (inserted.sign == "-") newTerm.changeSign();
                break;
            }

            if (!(item instanceof Frac) || !(item.numerator.allMultipliers().includes(mult) ||
                item.denomerator.allMultipliers().includes(mult))) continue;

            // for fraction mult
            let frac = item.copy();
            let wrap = new Term([frac]);

            if (frac.numerator.content.includes(mult)) {
                frac.numerator.content.splice(frac.numerator.content.indexOf(mult), 1);
                wrap.mul(inserted);
            }
            if (frac.denomerator.content.includes(mult)) {
                frac.denomerator.content.splice(frac.numerator.content.indexOf(mult), 1);
                wrap.devide(inserted);
            }
            frac.denomerator.removeExtraBlocks();
            frac.numerator.removeExtraBlocks();

            newTerm.content.splice(i, 1, wrap.content[0]);
            if (wrap.sign == "-") newTerm.changeSign();
            break;
        }

        for (let i = 0; i < part.content.length; i++) {
            if (part.content[i].isEqual(term)) {
                part.content.splice(i, 1, newTerm);
                break;
            }
        }
        part.simplify();

        return this._copyWithModifiedPart(part, term);
    }

    /**
     * @param  {...Formula} formulas
     * @return {Formula}
     */
    add(...formulas) {
        let leftPart = this.leftPart().copy();
        let rightPart = this.rightPart().copy();

        for (let formula of formulas) {
            leftPart.add(formula.leftPart());
            rightPart.add(formula.rightPart());
        }

        leftPart.simplify();
        rightPart.simplify();

        return new Formula([leftPart, rightPart]);
    }

    /**
     * @param {Formula} formula
     * @return {Formula}
     */
    subtract(formula) {
        let leftPart = this.leftPart().copy();
        let rightPart = this.rightPart().copy();

        leftPart.subtract(formula.leftPart());
        rightPart.subtract(formula.rightPart());

        leftPart.simplify();
        rightPart.simplify();

        return new Formula([leftPart, rightPart]);
    }

    /**
     * @param {Formula} formula
     * @return {Formula}
     */
    divide(formula) {
        let leftPart = this.leftPart().copy();
        let rightPart = this.rightPart().copy();

        if (leftPart.content.length > 1) {
            leftPart = Block.wrap(leftPart);
        }
        if (rightPart.content.length > 1) {
            rightPart = Block.wrap(rightPart);
        }

        leftPart.content[0].devide(
            formula.leftPart().content.length > 1 ? formula.leftPart() : formula.leftPart().content[0]);
        rightPart.content[0].devide(
            formula.rightPart().content.length > 1 ? formula.rightPart() : formula.rightPart().content[0]);

        leftPart.content[0].simplify();
        rightPart.content[0].simplify();
        leftPart.removeExtraBlocks();
        rightPart.removeExtraBlocks();

        return new Formula([leftPart, rightPart]);
    }
}


