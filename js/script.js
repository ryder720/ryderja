document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    console.log("Website template initialized. Add your custom JavaScript here.");

    // Future enhancement: Dynamically load projects from a JSON file or directly from the /projects directory
});