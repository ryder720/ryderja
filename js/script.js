document.addEventListener('DOMContentLoaded', () => {
    // Set current year in any element with the class 'dynamic-year'
    const yearSpans = document.querySelectorAll('.dynamic-year');
    yearSpans.forEach(span => {
        if (span) {
            span.textContent = new Date().getFullYear();
        }
    });
    console.log("Website template initialized. Add your custom JavaScript here.");

    // Future enhancement: Dynamically load projects from a JSON file or directly from the /projects directory
});