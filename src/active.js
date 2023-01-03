let _activeTypes = {
    mult: 0,
    term: 1,
    formula: 2,
    text: 3,
};

/**
 * set css class to html element depending on the activeType
 * @param {ActiveFormula|ActiveText} active selected element
 */
function setSelectedStyle(active) {
    switch (_getActiveType(active)) {
    case _activeTypes.formula:
        active.HTML.classList.toggle("active-formula");
        break;
    case _activeTypes.term:
        active.HTML.classList.toggle("active-term");
        break;
    case _activeTypes.mult:
        active.HTML.classList.toggle("active-mult");
        break;
    case _activeTypes.text:
        active.HTML.classList.toggle("active-text");
        break;
    }
}

/**
 * Returns type of active element
 * @param {ActiveFormula | ActiveText} struct active element
 * @return {number} active element type id
 */
function _getActiveType(struct) {
    if (struct.text!=null) {
        return _activeTypes.text;
    } else if (struct.main!=null) {
        if (struct.main instanceof Formula) {
            return _activeTypes.formula;
        } if (struct.main instanceof Term) {
            return _activeTypes.term;
        } if (struct.main instanceof MathStructure) {
            return _activeTypes.mult;
        }
    }
}


/**
 * Remove all selected elements
 */
function deleteActiveAll() {
    for (let key in selected) {
        for (let obj of selected[key]) {
            setSelectedStyle(obj);
        }
        selected[key] = [];
    }
}
