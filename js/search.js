(() => {
    const { normalize, uniqueSorted } = window.AnsilianUtils;

    function createToggleStateMap() {
        return new Map();
    }

    function cycleThreeState(map, key) {
        const states = ["neutral", "include", "exclude"];
        const current = map.get(key) || "neutral";
        const next = states[(states.indexOf(current) + 1) % states.length];
        map.set(key, next);
        return next;
    }

    function selectedKeys(map, state) {
        return [...map.entries()]
            .filter(([, value]) => value === state)
            .map(([key]) => key);
    }

    function matchesTextQuery(query, values) {
        const normalizedQuery = normalize(query);
        if (!normalizedQuery) return true;
        return values.some((value) => normalize(value).includes(normalizedQuery));
    }

    function collectUnique(items, getter) {
        return uniqueSorted(items.flatMap(getter));
    }

    window.AnsilianSearch = {
        createToggleStateMap,
        cycleThreeState,
        selectedKeys,
        matchesTextQuery,
        collectUnique,
    };
})();
