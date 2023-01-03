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
     * @param {Block} part  changed active part
     * @param {Term} term  term from active part
     * @param {boolean} removeMiddle
     * @return {Formula}
     */
    copyWithModifiedPart(part, term, removeMiddle=true) {
        let newFormula = this.copy();
        if (this._getActivePart(term) == this.rightPart()) {
            newFormula.equalityParts[newFormula.equalityParts.length-1] = part;
        } else {
            newFormula.equalityParts[0] = part;
        }
        if (removeMiddle) {
            return new Formula([newFormula.leftPart(), newFormula.rightPart()]);
        } else {
            return newFormula;
        }
    }

    /**
     * @param {Block} block
     * @return {MathStructure}
     */
    static _getMultiplier(block) {
        if (block.content.length != 1 || block.content[0].sign == "-" || block.content[0].content.length != 1) {
            return block;
        }
        return block.content[0].content[0];
    }

    /**
     * @param {Array<Term>} oldTerms
     * @param {Term} newTerm
     * @return {Block}
     */
    _replaceTerms(oldTerms, newTerm) {
        let newPart = this._getActivePart(oldTerms[0]).copy();
        if (newTerm) newPart.content.push(newTerm);
        for (let term of oldTerms) {
            newPart.content.splice(newPart.content.findIndex((el) => el.isEqual(term)), 1);
        }
        return newPart;
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

        let inverted = false;
        for (let item of term.content) {
            if (item==mult) continue;
            if (!(item instanceof Frac)) {
                rightPart.content[0].devide(item.copy());
                continue;
            }
            if (item.numerator.sign=="-") rightPart.content[0].changeSign();
            if (item.denomerator.sign=="-") rightPart.content[0].changeSign();
            for (let itemN of item.numerator.content) {
                if (itemN!=mult) rightPart.content[0].devide(itemN.copy());
            }
            for (let itemD of item.denomerator.content) {
                if (itemD==mult) inverted = true;
                else rightPart.content[0].mul(itemD.copy());
            }
        }
        if (inverted) {
            rightPart.content[0].transformToFrac();
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
     * @return {Block}
     */
    openBrackets(block, term) {
        let part = this._getActivePart(term).copy();

        let newTerms = [];

        let termCopy = term.copy();
        termCopy.content.splice(term.content.indexOf(block), 1);
        block.content.forEach((item) => {
            let newTerm = termCopy.copy();
            newTerm.mul(item.copy());
            newTerms.push(newTerm);
        });

        for (let i = 0; i < part.content.length; i++) {
            if (this._getActivePart(term).content[i].content.includes(block)) {
                part.content.splice(i, 1, ...newTerms);
                break;
            }
        }
        part.simplify();

        return part;
    }

    /**
     * @param {Block} block
     * @param {Term} term
     * @return {Block}
     */
    openBracketsFrac(block, term) {
        let newTerm = term.copy();
        for (let i=0; i<term.content.length; i++) {
            if (!(term.content[i] instanceof Frac)) continue;
            newTerm.content[i] = newTerm.content[i].copy();
            if (term.content[i].numerator.content.includes(block)) {
                let formula = new Formula([Block.wrap(term.content[i].numerator)]);
                newTerm.content[i].numerator = new Term([formula.openBrackets(block, term.content[i].numerator)]);
                newTerm.content[i].numerator.removeExtraBlocks();
            } else if (term.content[i].denomerator.content.includes(block)) {
                let formula = new Formula([Block.wrap(term.content[i].denomerator)]);
                newTerm.content[i].denomerator = new Term([formula.openBrackets(block, term.content[i].denomerator)]);
                newTerm.content[i].denomerator.removeExtraBlocks();
            }
        }
        return this._replaceTerms([term], newTerm);
    }

    /**
     * @param {Term} term
     * @param {Formula} otherFormula
     * @return {Block}
     */
    substituteTerm(term, otherFormula) {
        let part = this._getActivePart(term).copy();
        for (let i = 0; i < part.content.length; i++) {
            if (part.content[i].isEqual(term)) {
                part.content.splice(i, 1, ...otherFormula.rightPart().copy().content);
                break;
            }
        }
        part.simplify();
        return part;
    }

    /**
     * @param {MathStructure} mult
     * @param {Term} term
     * @param {Formula} otherFormula formula with separated multiplier
     * @return {Formula}
     */
    substituteMultiplier(mult, term, otherFormula) {
        let part = this._getActivePart(term).copy();

        let newTerm = term.copy();
        let inserted = otherFormula.rightPart().content.length == 1 ?
            otherFormula.rightPart().content[0] : new Term([otherFormula.rightPart()]);

        for (let i = 0; i < term.content.length; i++) {
            let item = term.content[i];
            // for non fraction mult
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

            if (item.numerator.content.includes(mult)) {
                frac.numerator.content.splice(item.numerator.content.indexOf(mult), 1);
                wrap.mul(inserted);
            }
            if (item.denomerator.content.includes(mult)) {
                frac.denomerator.content.splice(item.numerator.content.indexOf(mult), 1);
                wrap.devide(inserted);
            }
            frac.denomerator.removeExtraBlocks();
            frac.numerator.removeExtraBlocks();

            newTerm.content.splice(i, 1, wrap.content[0]);
            if (wrap.sign == "-") newTerm.changeSign();
            break;
        }

        part = this._replaceTerms([term], newTerm);
        part.simplify();
        return part;
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

    /**
     * @param {Power} mult
     * @return {Formula}
     */
    removeExponent(mult) {
        if (!this.isSeparatedMultiplier(mult) || !(mult instanceof Power)) {
            throw new Error("Unable to remove exponent");
        }

        let leftPart = Block.wrap(mult.base);
        let rightPart = Block.wrap(
            new Sqrt(Formula._getMultiplier(this.rightPart().copy()), mult.exponent.copy()));
        return new Formula([leftPart, rightPart]);
    }

    /**
     * @param {Block} multBlock
     * @return {Formula}
     */
    multiply(multBlock) {
        let newFormula = new Formula([this.leftPart().copy(), this.rightPart().copy()]);
        let multiplier = multBlock.content.length != 1 ? multBlock : multBlock.content[0];
        for (let part of newFormula.equalityParts) {
            for (let term of part.content) {
                term.mul(multiplier);
                term.simplify();
            }
            part.removeExtraBlocks();
        }

        return newFormula;
    }

    /**
     * @param {Array<Term>} terms
     * @param {Block} multBlock
     * @return {Block}
     */
    moveOutOfBracket(terms, multBlock) {
        let active = this._getActivePart(terms[0]);
        for (let term of terms) {
            if (!active.content.includes(term)) throw new Error("Unable to move out of bracket");
        }

        let newTerm = multBlock.content.length != 1 ?new Term([multBlock]) : multBlock.content[0];
        let bracketContent = [];
        for (let term of terms) {
            term = term.copy();
            term.devide(newTerm);
            term.simplify();
            bracketContent.push(term);
        }
        newTerm.mul(new Block(bracketContent));
        return this._replaceTerms(terms, newTerm);
    }


    /**
     * @param  {...Term} terms
     * @return {Block}
     */
    toCommonDenominator(...terms) {
        let active = this._getActivePart(terms[0]);
        for (let term of terms) {
            if (!active.content.includes(term)) throw new Error("Unable to move out of bracket");
        }

        let newNum = new Term([new Block([])]);
        let newDenom = new Term([Block.wrap(new Num(1))]);
        for (let term of terms) {
            term = term.copy();
            term.transformToFrac();
            term.content[0] = term.content[0].copy();

            let coefs = this._getComplementaryCoefs(newDenom, term.content[0].denomerator);
            newDenom.mul(coefs.denomerator);
            newDenom.simplify();
            for (let numTerm of newNum.content[0].content) {
                numTerm.mul(coefs.denomerator);
                numTerm.simplify();
            }

            if (term.sign == "-") term.content[0].numerator.changeSign();
            if (coefs.sign == "-") term.content[0].numerator.changeSign();
            term.content[0].numerator.mul(coefs.numerator);
            term.content[0].numerator.simplify();
            newNum.content[0].add(term.content[0].numerator);
        }
        return this._replaceTerms(terms, new Term([new Frac(newNum, newDenom)]));
    }

    /**
     * @param {Term} a
     * @param {Term} b
     * @return {Frac}
     */
    _getComplementaryCoefs(a, b) {
        let coefTerm = a.copy();
        coefTerm.transformToFrac();

        coefTerm.devide(b);
        coefTerm.simplify();
        coefTerm.transformToFrac();
        return coefTerm.content[0];
    }
}


