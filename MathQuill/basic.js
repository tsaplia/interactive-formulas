const specialSymbols = {
    minus: {
        sym: "−",
        TeX: "-",
    },
    prime: {
        sym: "′",
        TeX: "'",
    },
};

const interactiveFieldFunctions = {
    t: "separateTerm",
    m: "separateMultiplier",
    o: "openBrackets",
    p: "substitute",
    a: "addEquations",
    s: "subtractEquations",
    d: "divideEquations"
};


function createFormula(latex) {
    let elem = document.createElement("div");
    elem.className = "formula";
    elem.innerText = latex;

    MQ.StaticMath(elem);
    return elem;
}


function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);

    while (b!=0) {
        a %= b;
        [a, b] = [b, a];
    }

    return a;
}


function addFractions(a, b) {
    if (!(a instanceof Array) && !a.size() == 2 && !(b instanceof Array) && !b.size() == 2) {
        throw new Error("Arguments should be Array of length 2");
    }

    let num = a[0]*b[1] + b[0]*a[1];
    let denom = b[1]*a[1];

    num /= gcd(num, denom);
    denom /= gcd(num, denom);

    if (denom<0) {
        num *= -1;
    }

    return [num, denom];
}


