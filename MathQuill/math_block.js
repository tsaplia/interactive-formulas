function Block(content) {
    this.content = content; // arrey of terms

    this.changeSignes = function() {
        this.content = this.content.map((term) => term.copy());
        this.content.forEach((term) => term.changeSign());
    };

    this.removeExtraBlocks = function() {
        let modified = false;
        for (let term of this.content) {
            if (term.content.length == 1 && term.content[0] instanceof Block && term.sign == "+") {
                this.content.splice(this.content.indexOf(term), 1, ...term.content[0].content);
                modified = true;
            }
        }

        return modified;
    };

    this.simplify = function() {
        this.removeExtraBlocks();

        for (let i=0; i<this.content.length; i++) {
            for (let j=i+1; j<this.content.length; j++) {
                if (!this.content[i].isSame(this.content[j])) continue;

                let curRatio = this.content[i].getRatio();
                if (this.content[i].sign == "-") {
                    curRatio[0] *= -1;
                }
                let nextRatio = this.content[j].getRatio();
                if (this.content[j].sign == "-") {
                    nextRatio[0] *= -1;
                }

                let sumRatio = addFractions(curRatio, nextRatio);

                let newTerm = this.content[i].copy();
                newTerm.deleteNumbersDeep();

                newTerm.insertCoef(Math.abs(sumRatio[0]), sumRatio[1]);
                newTerm.emptyContentCheck();
                newTerm.sign = sumRatio[0] < 0 ? "-" : "+";

                this.content.splice(i, 1, newTerm);
                this.content.splice(j, 1);
                j--;
            }
        }

        this._removeZeroTerms();
    };

    this._removeZeroTerms = function() {
        for (let i=0; i<this.content.length; i++) {
            if (this.content[i].getRatio()[0] == 0) {
                this.content.splice(i, 1);
                i--;
            }
        }

        if (!this.content.length) {
            this.content.push(new Term([new Num(0)]));
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

    this.subtract = function(...items) {
        for (let item of items) {
            if (item instanceof Term) {
                let newItem = item.copy();
                newItem.changeSign();
                this.add(newItem);
            } else if (item instanceof Block) {
                this.subtract(item.content);
            } else {
                throw new Error(`Can\`t add ${item.constructor.name} to Block`);
            }
        }
    };

    this.getMultipliers = function() {
        let multipliers = [];

        if (this.content.length == 1) {
            multipliers.push(...this.content[0].content);
        } else {
            multipliers.push(this);
        }

        return multipliers;
    };

    this.toTex = function() {
        let str = "";
        for (let i = 0; i < this.content.length; i++) {
            if (i != 0 || this.content[i].sign != "+") {
                str += this.content[i].sign;
            }

            str += this.content[i].toTex();
        }

        for (let symbol of Object.values(specialSymbols)) {
            str.replace(symbol.sym, symbol.TeX);
        }

        console.assert(this.content.length, "Empty block content");

        return str;
    };

    this.isEqual = function(other) {
        if (!(other instanceof Block) || this.content.length != other.content.length) return false;

        for (let i = 0; i < this.content.length; i++) {
            if (!this.content[i].isEqual(other.content[i])) return false;
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

Block.wrap = function wrap(struct, sign = "+") {
    if (struct instanceof Term) {
        return new Block([struct]);
    }

    return new Block([new Term([struct], sign)]);
};
