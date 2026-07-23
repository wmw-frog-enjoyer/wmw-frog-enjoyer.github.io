// Loads reusable HTML components and centers the nav correctly for both odd and even button counts.
// Use in pages with: <div data-component="navbar"></div><script src="/nav.js"></script>

const componentCache = new Map();

function alignCenterNav() {
    const nav = document.querySelector(".center-nav");
    if (!nav) return;

    // On mobile (max-width: 767px), just let it be centered by standard flexbox
    if (window.innerWidth <= 767) {
        nav.style.transform = "";
        return;
    }

    const links = [...nav.querySelectorAll("a")];
    const count = links.length;
    if (count === 0) return;

    // reset any previous adjustment before recalculating
    nav.style.transform = "";

    const pageCenter = window.innerWidth / 2;

    if (count % 2 === 1) {
        // odd number of buttons: put the middle button's center at the page center
        const middleLink = links[Math.floor(count / 2)];
        const r = middleLink.getBoundingClientRect();
        const buttonCenter = r.left + r.width / 2;
        const offset = pageCenter - buttonCenter;
        nav.style.transform = `translateX(${offset}px)`;
    } else {
        // even number of buttons: put the gap between the two middle buttons at the page center
        const leftOfGap = links[count / 2 - 1];
        const rightOfGap = links[count / 2];
        const gapCenter =
            (leftOfGap.getBoundingClientRect().right +
                rightOfGap.getBoundingClientRect().left) /
            2;
        const offset = pageCenter - gapCenter;
        nav.style.transform = `translateX(${offset}px)`;
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

async function loadComponent(name) {
    if (!componentCache.has(name)) {
        componentCache.set(
            name,
            fetch(`/components/${name}.html`).then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load component: ${name}`);
                }
                return response.text();
            }),
        );
    }

    return componentCache.get(name);
}

async function renderComponent(name, data = {}) {
    const template = await loadComponent(name);
    return template.replace(
        /\{\{\{\s*([\w-]+)\s*\}\}\}|\{\{\s*([\w-]+)\s*\}\}/g,
        (_match, rawKey, escapedKey) => {
            const key = rawKey || escapedKey;
            const value = data[key] ?? "";
            return rawKey ? String(value) : escapeHtml(value);
        },
    );
}

async function loadStaticComponents() {
    const componentHosts = document.querySelectorAll("[data-component]");

    await Promise.all(
        [...componentHosts].map(async (host) => {
            const componentName = host.dataset.component;
            host.innerHTML = await loadComponent(componentName);
        }),
    );

    alignCenterNav();
}

window.renderComponent = renderComponent;

document.addEventListener("DOMContentLoaded", loadStaticComponents);
window.addEventListener("resize", alignCenterNav);
