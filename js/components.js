(() => {
    const componentCache = new Map();
    const { escapeHtml } = window.AnsilianUtils;

    // Resolve the "components/" folder relative to THIS script's own URL
    // (js/components.js and components/ are siblings under the project root)
    // instead of assuming the site is served from the domain root. This must
    // be captured synchronously at parse-time, since document.currentScript
    // is only set while the script is initially executing.
    const componentsBaseUrl = (() => {
        const scriptEl =
            document.currentScript ||
            document.querySelector('script[src*="components.js"]');
        if (scriptEl && scriptEl.src) {
            return new URL("../components/", scriptEl.src).href;
        }
        // Fallback: best guess if we somehow can't find the script tag
        return new URL("/components/", window.location.origin).href;
    })();

    async function loadComponent(name) {
        if (!componentCache.has(name)) {
            componentCache.set(name, fetchComponent(name));
        }

        return componentCache.get(name);
    }

    async function fetchComponent(name) {
        try {
            const response = await fetch(
                new URL(`${name}.html`, componentsBaseUrl),
            );
            if (!response.ok) {
                throw new Error(`Failed to load component: ${name}`);
            }
            return await response.text();
        } catch (error) {
            console.error(error);
            return "";
        }
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

        try {
            await Promise.all(
                [...componentHosts].map(async (host) => {
                    const componentName = host.dataset.component;
                    host.innerHTML = await loadComponent(componentName);
                }),
            );
        } catch (error) {
            console.error("Failed to load static components:", error);
        } finally {
            window.dispatchEvent(new CustomEvent("components:loaded"));
        }
    }

    window.AnsilianComponents = {
        loadComponent,
        renderComponent,
        loadStaticComponents,
    };
    window.renderComponent = renderComponent;

    document.addEventListener("DOMContentLoaded", loadStaticComponents);
})();
