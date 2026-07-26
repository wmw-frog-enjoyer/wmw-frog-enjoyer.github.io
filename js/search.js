document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('universal-search-input');
  const clearBtn = document.getElementById('clear-search-btn');
  const categorySelect = document.getElementById('category-select');
  const authorSelect = document.getElementById('author-select');
  const tagSelect = document.getElementById('tag-select');
  const resultsGrid = document.getElementById('search-results-grid');
  const resultsTitle = document.getElementById('results-title');
  const resultsCount = document.getElementById('results-count');
  const subFilters = document.querySelectorAll('.sub-filter');

  let allData = [];

  // 1. Fetch data from all project endpoints
  async function loadAllData() {
    try {
      const endpoints = [
        { url: '/articles/posts/posts.json', category: 'articles', typeLabel: 'Article' },
        { url: '/ss-hub/articles/posts/posts.json', category: 'ss-hub-articles', typeLabel: 'SS-Hub Article' },
        { url: '/archivers/archivers.json', category: 'archivers', typeLabel: 'Archiver' },
        { url: '/ss-hub/customs/customs.json', category: 'customs', typeLabel: 'Custom' }
      ];

      const responses = await Promise.all(
        endpoints.map(ep => fetch(ep.url).then(res => res.ok ? res.json() : []).catch(() => []))
      );

      allData = responses.flatMap((items, idx) =>
        items.map(item => ({
          ...item,
          category: endpoints[idx].category,
          typeLabel: endpoints[idx].typeLabel,
          // Normalize dates for sorting latest added items
          timestamp: new Date(item.date || item.addedDate || 0).getTime()
        }))
      );

      populateDropdowns();
      renderResults(); // Defaults to previewing latest added items
    } catch (error) {
      console.error('Error loading universal search data:', error);
      resultsGrid.innerHTML = '<p class="error-msg">Failed to load search data.</p>';
    }
  }

  // 2. Populate author and tag filter dropdowns dynamically
  function populateDropdowns() {
    const authors = new Set();
    const tags = new Set();

    allData.forEach(item => {
      if (item.author) authors.add(item.author);
      if (item.tag) tags.add(item.tag);
      if (item.type) tags.add(item.type);
    });

    authorSelect.innerHTML = '<option value="all">All Authors</option>' +
      Array.from(authors).sort().map(a => `<option value="${a}">${a}</option>`).join('');

    tagSelect.innerHTML = '<option value="all">All Tags</option>' +
      Array.from(tags).sort().map(t => `<option value="${t}">${t}</option>`).join('');

    updateSubfilterVisibility('all');
  }

  // 3. Toggle filter visibility based on website category
  function updateSubfilterVisibility(selectedCategory) {
    subFilters.forEach(filter => {
      const allowedCategories = filter.getAttribute('data-category').split(' ');
      if (selectedCategory === 'all' || allowedCategories.includes(selectedCategory)) {
        filter.style.display = 'flex';
      } else {
        filter.style.display = 'none';
      }
    });
  }

  // 4. Filter and Render logic
  function renderResults() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedCategory = categorySelect.value;
    const selectedAuthor = authorSelect.value;
    const selectedTag = tagSelect.value;

    let filtered = allData.filter(item => {
      const matchesQuery = !query ||
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.content && item.content.toLowerCase().includes(query));

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesAuthor = selectedAuthor === 'all' || item.author === selectedAuthor;
      const matchesTag = selectedTag === 'all' || item.tag === selectedTag || item.type === selectedTag;

      return matchesQuery && matchesCategory && matchesAuthor && matchesTag;
    });

    // Sort by latest added timestamp descending
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    // If no filters/search are active, show "Latest Added Items" preview limit (e.g., top 12)
    const isDefaultView = !query && selectedCategory === 'all' && selectedAuthor === 'all' && selectedTag === 'all';
    if (isDefaultView) {
      resultsTitle.textContent = 'Preview: Latest Added Items';
      filtered = filtered.slice(0, 12);
    } else {
      resultsTitle.textContent = 'Search Results';
    }

    resultsCount.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'} found`;

    // Render cards
    if (filtered.length === 0) {
      resultsGrid.innerHTML = '<p class="no-results">No items matched your search criteria.</p>';
      return;
    }

    resultsGrid.innerHTML = filtered.map(item => `
      <article class="search-card" data-category="${item.category}">
        <div class="card-meta">
          <span class="badge ${item.category}">${item.typeLabel}</span>
          ${item.date ? `<time>${item.date}</time>` : ''}
        </div>
        <h3><a href="${item.url || '#'}/${item.id || ''}">${item.title || 'Untitled'}</a></h3>
        <p>${item.description || item.excerpt || 'No description available.'}</p>
        <div class="card-footer">
          ${item.author ? `<span class="author">By ${item.author}</span>` : '<span></span>'}
          ${item.tag ? `<span class="tag">#${item.tag}</span>` : ''}
        </div>
      </article>
    `).join('');
  }

  // Event Listeners
  searchInput.addEventListener('input', () => {
    clearBtn.style.display = searchInput.value ? 'block' : 'none';
    renderResults();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    renderResults();
    searchInput.focus();
  });

  categorySelect.addEventListener('change', (e) => {
    updateSubfilterVisibility(e.target.value);
    authorSelect.value = 'all';
    tagSelect.value = 'all';
    renderResults();
  });

  authorSelect.addEventListener('change', renderResults);
  tagSelect.addEventListener('change', renderResults);

  // Initialize
  loadAllData();
});
