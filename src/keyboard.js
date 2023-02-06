let kbContainer = document.getElementById("keyboard");
let kbBox = document.getElementById("keyboard-box");
let _shifts = [];
let _shiftPresssed = false;

function _toggleShifts() {
    _shiftPresssed = !_shiftPresssed;
    for (let pair of _shifts) {
        if (_shiftPresssed) {
            pair[0].parentElement.insertBefore(pair[1], pair[0]);
            pair[0].parentElement.removeChild(pair[0]);
        } else {
            pair[1].parentElement.insertBefore(pair[0], pair[1]);
            pair[1].parentElement.removeChild(pair[1]);
        }
    }
}

function _keyHandler(elem, key) {
    elem.addEventListener("click", ()=>{
        if (key.shift) _toggleShifts();
        else if (key.keystroke) currentInput.keystroke(key.keystroke);
        else if (key.write) currentInput.write(key.write);
        else if (key.cmd || key.label) {
            for (let cmd of (key.cmd || key.label).split(" ")) currentInput.cmd(cmd);
        }
        currentInput.focus();
    });
}

function _getKey(key) {
    let elem = document.createElement("div");
    elem.classList.add("item", "col", "btn");
    if (key.keystroke || key.shift) {
        elem.classList.add("btn-secondary");
    } else {
        elem.classList.add("btn-light");
    }
    if (key.label) elem.innerHTML = key.label;
    else if (key.latex || key.cmd) {
        elem.innerHTML = `$$${key.latex || key.cmd}$$`;
        MathJax.typeset([elem]);
    }
    _keyHandler(elem, key);
    if (key.onShift) {
        _shifts.push([elem, _getKey({cmd: key.onShift})]);
    }
    return elem;
}

function _getSubRow(subRow) {
    let elem = document.createElement("div");
    elem.classList.add("row");
    elem.style.width = subRow.width*10 + "%";
    for (let key of subRow.keys) {
        elem.appendChild(_getKey(key));
    }
    return elem;
}

function _getRow(row) {
    let elem = document.createElement("div");
    elem.classList.add("row", row.length==1?"justify-content-center":"justify-content-between");
    for (let subRow of row) {
        elem.appendChild(_getSubRow(subRow));
    }
    return elem;
}

function _getKeyboard(keyboard) {
    let elem = document.createElement("div");
    for (let row of keyboard) {
        elem.appendChild(_getRow(row));
    }
    return elem;
}

let keyboards = [
    {
        btnId: "main-kb",
        keyboard: mainKeyboard,
    },
    {
        btnId: "greek-kb",
        keyboard: greekKeyboard,
    },
    {
        btnId: "latin-kb",
        keyboard: latinKeyboard,
    },
];

window.addEventListener("load", ()=>{
    for (let obj of keyboards) {
        let elem = _getKeyboard(obj.keyboard);
        document.getElementById(obj.btnId).addEventListener("click", ()=>{
            if (currentInput)currentInput.focus();
            kbContainer.removeChild(kbContainer.firstChild);
            kbContainer.appendChild(elem);
        });
    }
    document.getElementById(keyboards[0].btnId).click();
});

document.getElementById("close-keyboard").addEventListener("click", ()=>{
    currentInput.focus();
    kbBox.style.display="none";
});


document.querySelectorAll(".mq-textarea textarea").forEach((elem)=>{
    elem.addEventListener("focusin", ()=>{
        kbBox.style.display="block";
    });
});

textInputArea.addEventListener("focusin", ()=>{
    kbBox.style.display="none";
});


