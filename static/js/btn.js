import {generateScatterPlot , redraw} from "./drawing.js"
import "./drawing_helper.js"

function bindButton(buttonId, handler) {
    const btn = document.getElementById(buttonId);
    if (!btn) {
        console.warn(`${buttonId} not found`);
        return;
    };

    btn.addEventListener("click", handler);
}

bindButton("calculateMean", () => {
    calculateMean();
})

bindButton("btn-corcoe-plot", () => {
    generateScatterPlot();
})