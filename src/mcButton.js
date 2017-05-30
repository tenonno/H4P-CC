"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function clearHoverState(button) {
    button.classList.remove('hover');
    button.classList.remove('active');
    button.classList.remove('focus');
}
exports.clearHoverState = clearHoverState;
function setupMCButtonEvents(button) {
    // Hover states freak out when a context menu is opened, so manually implement default/hover/active so we can force clear it on context click
    button.addEventListener('mouseover', (event) => {
        button.classList.add('hover');
    });
    button.addEventListener('mouseleave', (event) => {
        clearHoverState(button);
    });
    button.addEventListener('mousedown', (event) => {
        // Depress button for left clicks only
        if (event.button == 0) {
            button.classList.add('active');
        }
    });
    button.addEventListener('mouseup', (event) => {
        button.classList.remove('active');
    });
    button.addEventListener('focus', (event) => {
        button.classList.add('focus');
    });
    button.addEventListener('blur', (event) => {
        button.classList.remove('focus');
    });
}
exports.setupMCButtonEvents = setupMCButtonEvents;
//# sourceMappingURL=mcButton.js.map