(() => {
    const componentCache = new Map();
    const { escapeHtml } = window.AnsilianUtils;

    async function loadComponent(name) {
        if (!componentCache.has(name)) {
            componentCache.set(name, fetchComponent(name));
        }

        return componentCache.get(name);
    }

    async function fetchComponent(name) {
        try {
            const response = await fetch(`/components/${name}.html`);
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
