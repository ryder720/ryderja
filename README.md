# Personal Website & Project Portfolio (GitHub Pages)

Starter template for showcasing web app projects, hosted on GitHub Pages.

## Structure

Key files and directories:
- `index.html`: Main landing page (project showcase).
- `professional.html`: Professional information, resume, and contact.
- `css/style.css`: Site-wide styles.
- `js/script.js`: Global JavaScript.
- `projects/`: This directory is where you'll place your individual web app projects.
    - Each project should be in its own sub-directory (e.g., `projects/my-cool-app/`).
    - Each project needs an `index.html` (or similar entry point).

## Adding a New Project

1.  **Create Project Folder:** In `projects/`, add a new folder (e.g., `projects/my-new-app/`).
    ```
    projects/
    └── my-awesome-app/
        ├── index.html
        ├── app.js
        └── style.css
        └── ... (other project files)
    ```

2.  **Develop Your Project:**
    Place all the files for your web app project (HTML, CSS, JavaScript, assets, etc.) into this new folder.

3.  **Link to Your Project from the Main Page:**
    Open the main `index.html` file (in the root directory). Find the `<section id="projects-list">`. You can add a "project card" or a simple link to your new project. For example:

    ```html
    <!-- Add this inside the <div class="project-grid"> in index.html -->
    <div class="project-card">
        <h3>My Awesome App</h3>
        <p>A short description of what this app does.</p>
        <a href="projects/my-awesome-app/index.html">View Project</a>
    </div>
    ```

## Adding a New Blog Post

1.  **Create Post File:** Create a new markdown file in `posts/entries/` (e.g., `posts/entries/my-new-post.md`).
2.  **Add Frontmatter:** Start the file with YAML frontmatter containing metadata:
    ```yaml
    ---
    title: "My New Post"
    date: "2025-01-01"
    description: "A short summary of the post."
    tags: ["tech", "life"]
    ---
    ```
3.  **Register Post:** Add the *filename* (without extension) to `posts/index.json`:
    ```json
    [
        "existing-post",
        "my-new-post"
    ]
    ```


