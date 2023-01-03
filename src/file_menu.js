let shotBox = document.querySelector("#shot-box");
let screenshot = document.getElementById("screenshot");

function download(data, filename, type) {
    let a = document.createElement("a");

    let url = type=="canvas" ? data.toDataURL("image/png") : URL.createObjectURL(new Blob([data], {type: type}));
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function latexWrap(text) {
    return `
\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\begin{document}
${text}
\\end{document}
`;
}

document.querySelector("#save-latex").addEventListener("click", ()=>{
    if (state==state.DIS) return;
    let data = "";
    for (let elem of interactiveField.children) {
        data += contentTeX[contentTeX.findIndex((obj)=>obj.elem==elem)].TeX + "\\par\n";
    }
    download(latexWrap(data), "if-project.tex", "tex");
});

document.querySelector("#save-image").addEventListener("click", ()=>{
    if (state==state.DIS) return;
    state.disable=true;
    html2canvas(interactiveField).then( (canvas) => {
        screenshot.appendChild(canvas);
        shotBox.style.display = "block";
    });
});

document.querySelector("#cancel-shot").addEventListener("click", ()=>{
    state.disable = false;
    shotBox.style.display = "none";
    screenshot.innerHTML = "";
});

document.querySelector("#save-shot").addEventListener("click", ()=>{
    download(screenshot.firstChild, "if-screenshot", "canvas");
    document.querySelector("#cancel-shot").click();
});

function displayContents(text) {
    const regexp = /\\begin{document}\n(.*)\n\\end{document}/s;
    let contents = text.match(regexp)[1].split("\\par\n");
    for (let content of contents) {
        if (!content || content=="\n") continue;
        insertTeX(content);
    }
}

document.getElementById("file-input").addEventListener("change", (e)=>{
    let file = e.target.files[0];
    if (!file) {
        return;
    }
    clearContent();
    try {
        let reader = new FileReader();
        reader.onload = function(e) {
            let contents = e.target.result;
            displayContents(contents);
        };
        reader.readAsText(file);
    } catch (error) {
        console.log("Error!!! Incorect file");
    }
}, false);
