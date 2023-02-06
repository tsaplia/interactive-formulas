const availibleLetters = [
    "alpha", "nu", "beta", "xi", "Xi", "gamma", "Gamma", "delta", "Delta", "pi", "Pi", "epsilon", "rho", "varrho",
    "zeta", "sigma", "Sigma", "eta", "tau", "theta", "Theta", "upsilon", "Upsilon", "iota", "phi", "Phi", "kappa",
    "chi", "lambda", "Lambda", "psi", "Psi", "mu", "omega", "Omega",
];

const availibleMathFunc = [
    "sin", "cos", "tan", "cot",
    "arcsin", "arccos", "arctan",
];

/**
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);

    while (b!=0) {
        a %= b;
        [a, b] = [b, a];
    }

    return a;
}


/**
 * @param {Array<number>} a
 * @param {Array<number>} b
 * @return {Array<number>}
 */
function addFractions(a, b) {
    if (!(a instanceof Array) && !a.size() == 2 && !(b instanceof Array) && !b.size() == 2) {
        throw new Error("Arguments should be Array of length 2");
    }

    let num = a[0]*b[1] + b[0]*a[1];
    let denom = b[1]*a[1];

    let g = gcd(num, denom);
    num /= g;
    denom /= g;

    if (denom<0) {
        num *= -1;
    }

    return [num, denom];
}


