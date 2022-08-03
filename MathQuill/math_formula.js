function Formula(equalityParts) {
    this.equalityParts = equalityParts;
}


Formula.prototype.toTex = function() {
    let TeX = "";

    for (let part of this.equalityParts) {
        TeX += (TeX ? "=" : "" )+ part.toTex();
    }

    return TeX;
};


Formula.prototype.copy = function() {
    return new Formula(this.equalityParts.map((part)=>part.copy()));
};


Formula.prototype.leftPart = function() {
    return this.equalityParts[0];
};


Formula.prototype.rightPart = function() {
    return this.equalityParts.slice(-1)[0];
};


Formula.prototype.isSeparatedTerm = function(term = null) {
    let f = this.leftPart().content.length == 1 && this.leftPart().content[0].sign == "+";
    if (term && this.leftPart().content[0] != term) f = false;
    return f;
};


Formula.prototype.isSeparatedMultiplier = function(mult = null) {
    let f = this.isSeparatedTerm() && this.leftPart().content[0].allMultipliers().length == 1 &&
            !(this.leftPart().content[0].content[0] instanceof Block);
    if (mult && this.leftPart().content[0].content[0] != mult) f = false;
    return f;
};


Formula.prototype._getActivePart = function(term) {
    if (this.leftPart().content.includes(term)) return this.leftPart();
    if (this.rightPart().content.includes(term)) return this.rightPart();
    else throw new Error();
};


Formula.prototype._getPassivePart = function(term) {
    if (this.leftPart().content.includes(term)) return this.rightPart();
    if (this.rightPart().content.includes(term)) return this.leftPart();
    else throw new Error();
};


Formula.prototype._copyWithModifiedPart = function(part, term) {
    if (this._getActivePart(term) == this.rightPart()) {
        return new Formula([this.leftPart(), part]);
    }

    return new Formula([part, this.rightPart().copy()]);
};


Formula.prototype.separateTerm = function(term) {
    let activePart = this._getActivePart(term);
    let passivePart = this._getPassivePart(term);

    let leftPart = Block.wrap(term.copy());
    let rightPart = passivePart.copy();

    for (let item of activePart.content) {
        if (item == term) continue;

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
};


Formula.prototype.separateMultiplier = function(mult, term) {
    let leftPart;
    let rightPart;
    [leftPart, rightPart] = this.separateTerm(term).equalityParts;

    if (rightPart.content.length > 1) {
        rightPart = Block.wrap( new Frac(rightPart, Block.wrap(new Num(1))) );
    }

    leftPart.content[0].transformToFrac();
    if (leftPart.content[0].content[0].denomerator.content.length > 1) {
        leftPart.content[0].content[0].denomerator =
            Block.wrap(leftPart.content[0].content[0].denomerator);
    }
    if (leftPart.content[0].content[0].numerator.content.length > 1) {
        leftPart.content[0].content[0].numerator = Block.wrap(leftPart.content[0].content[0].numerator);
    }

    let inverted = false;
    for (let item of leftPart.content[0].content[0].denomerator.content[0].content) {
        if (item === mult) {
            inverted = true;
            continue;
        }

        rightPart.content[0].mul(item);
    }

    for (let item of leftPart.content[0].content[0].numerator.content[0].content) {
        if (item === mult) continue;

        rightPart.content[0].devide(item);
    }

    if (inverted) {
        rightPart.content[0].content[0].invert();
    }

    rightPart.content[0].simplify();
    rightPart.simplify();
    leftPart = Block.wrap(mult);
    leftPart.simplify();

    return new Formula([leftPart, rightPart]);
};


Formula.prototype.openBrackets = function(block, term) {
    let part = this._getActivePart(term).copy();

    let newTerms = [];
    block.content.forEach((item)=>{
        let newTerm = term.copy();
        newTerm.content.splice(newTerm.content.indexOf(block), 1);

        newTerm.mul(item);
        newTerms.push(newTerm);
    });

    for (let i=0; i<part.content.length; i++) {
        if (!part.content[i].content.includes(block)) continue;

        part.content.splice(i, 1, ...newTerms);
    }

    return this._copyWithModifiedPart(part, term);
};


Formula.prototype.substituteTerm = function(term, otherFormula) {
    let part = this._getActivePart(term).copy();
    for (let i=0; i<part.content.length; i++) {
        if (!part.content[i].isEqual(term)) continue;

        part.content.splice(i, 1, ...otherFormula.rightPart().copy().content);
        break;
    }

    return this._copyWithModifiedPart(part, term);
};


Formula.prototype.substituteMultiplier = function(mult, term, otherFormula) {
    let part = this._getActivePart(term).copy();

    let newTerm = term.copy();
    for (let i=0; i<newTerm.content.length; i++) {
        let item = newTerm.content[i];

        if (item == mult) {
            newTerm.content.splice(i, 1, otherFormula.rightPart());
            newTerm.removeExtraBlocks();
            break;
        }
        if (!(item instanceof Frac) || !(item.numerator.getMultipliers().includes(mult) ||
                item.denomerator.getMultipliers().includes(mult))) continue;

        let frac = item.copy();
        let wrap = new Term([frac]);

        if ( frac.numerator.content[0].content.includes(mult)) {
            frac.numerator.content[0].content.splice(frac.numerator.content[0].content.indexOf(mult), 1);
            wrap.mul(otherFormula.rightPart());
        }

        if ( frac.denomerator.content[0].content.includes(mult)) {
            frac.denomerator.content[0].content.splice(frac.numerator.content[0].content.indexOf(mult), 1);
            wrap.devide(otherFormula.rightPart());
        }

        frac.denomerator.removeExtraBlocks();
        frac.numerator.removeExtraBlocks();

        newTerm.content.splice(i, 1, wrap.content[0]);
        if (wrap.sign == "-") newTerm.changeSign();
        break;
    }

    for (let i=0; i<part.content.length; i++) {
        if (!part.content[i].isEqual(term)) continue;

        part.content.splice(i, 1, newTerm);
        break;
    }

    return this._copyWithModifiedPart(part, term);
};


Formula.prototype.add = function(...formulas) {
    let leftPart = this.leftPart().copy();
    let rightPart = this.rightPart().copy();

    for (let formula of formulas) {
        leftPart.add(formula.leftPart());
        rightPart.add(formula.rightPart());
    }

    leftPart.simplify();
    rightPart.simplify();

    return new Formula([leftPart, rightPart]);
};


Formula.prototype.subtract = function(formula) {
    let leftPart = this.leftPart().copy();
    let rightPart = this.rightPart().copy();

    leftPart.subtract(formula.leftPart());
    rightPart.subtract(formula.rightPart());

    leftPart.simplify();
    rightPart.simplify();

    return new Formula([leftPart, rightPart]);
};

