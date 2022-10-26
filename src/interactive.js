class Interactive {
    constructor(elem) {
        /** @type {HTMLElement} */
        this.root = elem; // element in which phisic formulas/content are rendered

        /** @type {boolean} */
        this.changeable = true; // can managers select or change elements

        /** @type {FormulaManager} */
        this.formulaManager = new FormulaManager(this); // responsible for formulas actions

        this.root.addEventListener("click", (event) => {
            if (event.target == this.root) {
                this.formulaManager.deleteActiveAll();
            }
        });

        document.addEventListener("copy", (event)=>{
            if(this.formulaManager.active.length != 1) return;
            let TeX = this.formulaManager.copy();
            if(TeX) {
                event.clipboardData.setData('text/plain', TeX);
            }
            event.preventDefault();
        });
    }

    insertContent(elem){
        this.root.append(elem);
    }
}