class IterStr {
    constructor(string) {
        /** @type {string} */
        this.str = string;

        /** @type {number} */
        this.it = 0;
    }

    add(n = 1) {
        this.it += n;
    }

    finished() {
        return this.it >= this.str.length;
    }

    startsWith(searchString) {
        if (this.finished());
        return this.str.startsWith(searchString, this.it);
    }

    valueOf = () => this.str;

    get cur() {
        if (this.finished()) error();
        return this.str[this.it];
    }
}

/**
 * @param {IterStr} itStr iterable string
 * @param {boolean} pm include signs "+", "-" or not
 * @return {boolean}
 */
function _endCheck(itStr, pm=true) {
    if (itStr.finished()) return true;

    let breakers = ["}", "\\right)", "=", "]"];
    if (pm) breakers.push("+", "-");

    for (let pref of breakers) {
        if (itStr.startsWith(pref)) return true;
    }
    return false;
}

function error(text=null) {
    throw new Error(text || "Incorrect input string");
}


/**
 * @param {string} str
 * @return {Formula}
 */
function formulaFromTeX(str) {
    let equalityParts = [];
    let itStr = new IterStr(str);

    while (!itStr.finished()) {
        let newBlock = blockFromTeX(itStr);
        equalityParts.push(newBlock);
        itStr.add();
    }
    if (!equalityParts.length) error();

    return new Formula(equalityParts);
}

/**
 * @param {IterStr} itStr
 * @return {MathStructure}
 */
function multiplierFromTex(itStr) {
    if (itStr.cur == " ") itStr.add();

    let newStruct;
    if (itStr.startsWith("\\frac")) {
        newStruct = fracFromTeX(itStr);
    } else if (itStr.startsWith("\\sqrt")) {
        newStruct = sqrtFromTeX(itStr);
    } else if (itStr.startsWith("\\vec")) {
        newStruct = vectorFromTex(itStr);
    } else if (itStr.startsWith("\\left(")) {
        newStruct = blockFromTeX(itStr, true);
    } else if (itStr.startsWith("\\")) {
        newStruct = specialNameFromTeX(itStr);
    } else if (!isNaN(itStr.cur)) {
        newStruct = numFromTeX(itStr);
    } else if (itStr.cur.match(/[A-Za-z]/i)) {
        newStruct = latinVariableFromTeX(itStr);
    } else error();

    if (itStr.startsWith("'")) {
        primeFromTeX(itStr, newStruct);
    }
    if (itStr.startsWith("_")) {
        indexFromTeX(itStr, newStruct);
    }
    if (itStr.startsWith("^")) {
        return powerFromTeX(itStr, newStruct);
    }
    return newStruct;
}

/**
 * @param {IterStr} itStr
 * @param {boolean} _wrapped
 * @return {Block}
 */
function blockFromTeX(itStr, _wrapped=false) {
    if (_endCheck(itStr, false)) error();

    if (_wrapped) {
        itStr.add(6);
    }
    let content = [];
    while (!_endCheck(itStr, false)) {
        content.push(termFromTeX(itStr));
    }
    if (!content.length) error();

    if (_wrapped) {
        if (itStr.startsWith("\\right)")) itStr.add(7);
        else error();
    }
    return new Block(content);
}

/**
 * @param {IterStr} itStr
 * @return {Term}
 */
function termFromTeX(itStr) {
    let sign = "+";
    let content = [];

    if (["+", "-"].includes(itStr.cur)) {
        sign = itStr.cur;
        itStr.add();
    }

    while (!_endCheck(itStr)) {
        if (itStr.startsWith("\\cdot")) {
            itStr.add(5);
        }
        content.push(multiplierFromTex(itStr));
    }

    if (!content.length) error();
    return new Term(content, sign);
}

/**
 * @param {IterStr} itStr
 * @return {Frac}
 */
function fracFromTeX(itStr) {
    let num; let denom;
    itStr.add(6);
    num = new Term([blockFromTeX(itStr)]);
    num.removeExtraBlocks();
    if (!itStr.startsWith("}{")) error();

    itStr.add(2);
    denom = new Term([blockFromTeX(itStr)]);
    denom.removeExtraBlocks();
    if (!itStr.startsWith("}")) error();
    itStr.add(1);

    return new Frac(num, denom);
}

/**
 * @param {IterStr} itStr
 * @param {MathStructure} base
 * @return {Power}
 */
function powerFromTeX(itStr, base) {
    let exponent;

    itStr.add();
    if (itStr.startsWith("{")) {
        itStr.add();
        exponent = blockFromTeX(itStr);
        itStr.add();
    } else {
        exponent = Block.wrap( isNaN(itStr.cur) ? new Num(itStr.cur) : new Variable(itStr.cur) );
        itStr.add();
    }

    return new Power(base, exponent);
}

/**
 * @param {IterStr} itStr
 * @return {sqrt}
 */
function sqrtFromTeX(itStr) {
    let root = Block.wrap(new Num(2));
    itStr.add(5);
    if (itStr.startsWith("[")) {
        itStr.add();
        root = blockFromTeX(itStr);
        if (!itStr.startsWith("]{")) error();
        itStr.add();
    }
    itStr.add();
    let base = blockFromTeX(itStr);
    if (base.content.length == 1 && base.content[0].content.length == 1 && base.content[0].sign == "+") {
        base = base.content[0].content[0];
    }

    if (!itStr.startsWith("}")) error();
    itStr.add();

    return new Sqrt(base, root);
}


/**
 * @param {IterStr} itStr
 * @return {Variable}
 */
function vectorFromTex(itStr) {
    itStr.add(5);
    let block = blockFromTeX(itStr);
    if (!itStr.startsWith("}")) error();
    itStr.add();

    if (block.content.length > 1 || block.content[0].content.length > 1 || block.content[0].sign == "-" ||
        !(block.content[0].content[0] instanceof Variable)) error();

    block.content[0].content[0].vector = true;
    return block.content[0].content[0];
}

/**
 * @param {IterStr} itStr
 * @return {Variable}
 */
function latinVariableFromTeX(itStr) {
    let newVar = new Variable(itStr.cur);
    itStr.add();
    return newVar;
}

/**
 * @param {IterStr} itStr
 * @param {Variable} base
 */
function indexFromTeX(itStr, base) {
    if (!(base instanceof Variable)) error();

    let index="";
    itStr.add();
    if (itStr.startsWith("{")) {
        itStr.add();
        index = blockFromTeX(itStr).toTex();
    } else {
        index = itStr.cur;
    }
    itStr.add();
    base.index = index;
}

/**
 * @param {IterStr} itStr
 * @param {Variable} base
 */
function primeFromTeX(itStr, base) {
    if (!(base instanceof Variable)) error();

    let primeCount = 0;
    while (itStr.cur == "'") {
        primeCount++;
        itStr.add();
    }
    base.primeCount = primeCount;
}

/**
 * @param {IterStr} itStr
 * @return {Num}
 */
function numFromTeX(itStr) {
    let start=itStr.it;
    while (!itStr.finished() && !isNaN(itStr.cur)) itStr.add();
    return new Num(itStr.str.slice(start, itStr.it));
}

/**
 * @param {IterStr} itStr
 * @return {Variable | Func}
 */
function specialNameFromTeX(itStr) {
    itStr.add();
    for (let name of availibleLetters) {
        if (!itStr.startsWith(name)) continue;
        itStr.add(name.length);
        return new Variable(`\\${name} `);
    }
    for (let name of availibleMathFunc) {
        if (!itStr.startsWith(name)) continue;
        itStr.add(name.length);
        return new Func(name, multiplierFromTex(itStr));
    }
    error();
}
