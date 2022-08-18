class Block extends MathStructure {
    constructor(content) {
        super();

        /** @type {Array<Term>} */
        this.content = content; // inner terms of block 
    }

    toTex() {
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
    }

    isEqual(other) {
        if (!(other instanceof Block) || this.content.length != other.content.length) {
            return false;
        }

        for (let i = 0; i < this.content.length; i++) {
            if (!this.content[i].isEqual(other.content[i])) {
                return false;
            }
        }

        return true;
    }

    /**
     * @returns {Block} copy of current block and all inner terms
     */
    copy() {
        return new Block(this.content.map((term) => term.copy()));
    }

    simplify() {
        this.removeExtraBlocks();
        for(let term of this.content){
            term.simplify();
        }

        for (let i = 0; i < this.content.length; i++) {
            for (let j = i + 1; j < this.content.length; j++) {
                if (!this.content[i].isSame(this.content[j])) {
                    continue;
                }

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
                newTerm.emptyContentCheck();
                newTerm._removeEmptyDenom();
                newTerm.deleteNumbers();

                newTerm.insertCoef(Math.abs(sumRatio[0]), sumRatio[1]);
                newTerm.emptyContentCheck();
                newTerm.sign = sumRatio[0] < 0 ? "-" : "+";

                this.content.splice(i, 1, newTerm);
                this.content.splice(j, 1);
                j--;
            }
        }

        this._removeZeroTerms();
    }

    /**
     * remove all plus-terms with only block multiplier
     * @returns {boolean} was block content modified
     */
    removeExtraBlocks() {
        let modified = false;
        for (let term of this.content) {
            if (term.content.length == 1 && term.content[0] instanceof Block && term.sign == "+") {
                this.content.splice(this.content.indexOf(term), 1, ...term.content[0].content);
                modified = true;
            }
        }

        return modified;
    }

    /**
     * Remove all inner terms that are equal to 0
     */
    _removeZeroTerms() {
        for (let i = 0; i < this.content.length; i++) {
            if (this.content[i].getRatio()[0] == 0) {
                this.content.splice(i, 1);
                i--;
            }
        }

        if (!this.content.length) {
            this.content.push(new Term([new Num(0)]));
        }
    }

    /**
     * Add terms/block to block
     * @param  {...Block | Term} items 
     */
    add(...items) {
        for (let item of items) {
            if (item instanceof Term) {
                this.content.push(item);
            } else if (item instanceof Block) {
                this.content.push(...item.content);
            } else {
                throw new Error(`Can\`t add ${item.constructor.name} to Block`);
            }
        }
    }

    /**
     * @param  {...Block | Term} items 
     */
    subtract(...items) {
        for (let item of items) {
            if (item instanceof Term) {
                let newItem = item.copy();
                newItem.changeSign();
                this.add(newItem);
            } else if (item instanceof Block) {
                this.subtract(...item.content);
            } else {
                throw new Error(`Can\`t add ${item.constructor.name} to Block`);
            }
        }
    }

    /**
     * Change signes of all inner terms
     */
    changeSignes() {
        this.content = this.content.map((term) => term.copy());
        this.content.forEach((term) => term.changeSign());
    }

    /**
     * @param {MathStructure} struct structure for wrapping
     * @param {string} [sign="+"] sign of wrapping term
     * @returns {Block} struct wrapped in a block 
     */
    static wrap(struct, sign = "+") {
        if (struct instanceof Term) {
            return new Block([struct]);
        }

        return new Block([new Term([struct], sign)]);
    }
}


