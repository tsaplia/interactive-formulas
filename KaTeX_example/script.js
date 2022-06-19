const renderButton = document.getElementById("render-button");
const inputField = document.getElementById("input-field");
const outputField = document.getElementById("output-field");
const statusField = document.getElementById("status");

renderButton.addEventListener("click", () => {
    katex.render(inputField.value, outputField,{
        displayMode: true,
        throwOnError: false,
        output: "html"
    });
});
