document.addEventListener('DOMContentLoaded', () => {
    const blogContent = document.getElementById('blog-content');
    const urlParams = new URLSearchParams(window.location.search);
    const postSlug = urlParams.get('post');

    // Update copyright year specific to this page if needed
    const yearSpan = document.getElementById('current-year-blog');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    if (postSlug) {
        loadPost(postSlug);
    } else {
        loadPostList();
    }

    async function loadPostList() {
        try {
            const response = await fetch('posts/index.json');
            if (!response.ok) throw new Error('Failed to load post list');
            const slugs = await response.json();

            // Fetch metadata for each post
            const posts = await Promise.all(slugs.map(async (slug) => {
                try {
                    const res = await fetch(`posts/entries/${slug}.md`);
                    if (!res.ok) return null;
                    const text = await res.text();
                    const match = text.match(/^---\n([\s\S]*?)\n---\n/);
                    if (match) {
                        const metadata = jsyaml.load(match[1]);
                        return { ...metadata, slug };
                    }
                    return null;
                } catch (e) {
                    console.error(`Error loading post ${slug}`, e);
                    return null;
                }
            }));

            // Filter out failed loads and sort by date
            const validPosts = posts.filter(p => p !== null);
            validPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

            let html = '<h2>Latest Posts</h2><div class="post-list">';
            if (validPosts.length === 0) {
                html += '<p>No posts found.</p>';
            } else {
                validPosts.forEach(post => {
                    html += `
                        <div class="post-card">
                            <h3><a href="blog.html?post=${post.slug}">${post.title || 'Untitled'}</a></h3>
                            <p class="post-meta">
                                <span class="post-date">${post.date || ''}</span>
                                ${post.tags ? `<span class="post-tags"> | ${post.tags.join(', ')}</span>` : ''}
                            </p>
                            ${post.description ? `<p>${post.description}</p>` : ''}
                        </div>
                    `;
                });
            }
            html += '</div>';
            blogContent.innerHTML = html;
        } catch (error) {
            console.error(error);
            blogContent.innerHTML = '<p>Error loading posts. Please try again later.</p>';
        }
    }

    async function loadPost(slug) {
        try {
            const response = await fetch(`posts/entries/${slug}.md`);
            if (!response.ok) {
                if (response.status === 404) {
                    blogContent.innerHTML = '<h2>Post not found</h2><p><a href="blog.html">Back to all posts</a></p>';
                    return;
                }
                throw new Error('Failed to load post');
            }
            const text = await response.text();

            // Separate frontmatter and content
            const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

            let metadata = {};
            let markdownContent = text;

            if (match) {
                try {
                    metadata = jsyaml.load(match[1]);
                    markdownContent = match[2];
                } catch (e) {
                    console.error("Error parsing YAML frontmatter", e);
                }
            }

            // Render Markdown
            const htmlContent = marked.parse(markdownContent);

            // Build the page structure
            let html = `
                <article class="blog-post">
                    <header>
                        <h2>${metadata.title || 'Untitled Post'}</h2>
                        <p class="post-meta">
                            <span class="post-date">${metadata.date || ''}</span>
                            ${metadata.tags ? `<span class="post-tags"> | ${metadata.tags.join(', ')}</span>` : ''}
                        </p>
                    </header>
                    <div class="post-body">
                        ${htmlContent}
                    </div>
                    <footer>
                        <p><a href="blog.html">← Back to all posts</a></p>
                    </footer>
                </article>
            `;

            blogContent.innerHTML = html;
            document.title = `${metadata.title || 'Blog'} - Ryder Anderson`;

        } catch (error) {
            console.error(error);
            blogContent.innerHTML = '<p>Error loading post.</p>';
        }
    }
});
