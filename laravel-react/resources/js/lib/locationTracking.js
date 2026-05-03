export const DEFAULT_STORE_LOCATION = {
    lat: 8.9475,
    lng: 125.5406,
    label: 'Inalog Silog Butuan',
};

const BUTUAN_CITY_LOCATION = {
    lat: 8.9492,
    lng: 125.5436,
    label: 'Butuan City',
};

const LOCAL_ADDRESS_HINTS = [
    {
        keywords: ['emenville', 'emerville', 'emenvile'],
        location: {
            lat: 8.9624,
            lng: 125.5258,
            label: 'Emenville, Butuan City',
        },
    },
    {
        keywords: ['libertad'],
        location: {
            lat: 8.9546,
            lng: 125.5261,
            label: 'Libertad, Butuan City',
        },
    },
    {
        keywords: ['ampayon'],
        location: {
            lat: 8.9892,
            lng: 125.5667,
            label: 'Ampayon, Butuan City',
        },
    },
    {
        keywords: ['doongan'],
        location: {
            lat: 8.9586,
            lng: 125.5571,
            label: 'Doongan, Butuan City',
        },
    },
    {
        keywords: ['villa kananga', 'kananga'],
        location: {
            lat: 8.9358,
            lng: 125.5143,
            label: 'Villa Kananga, Butuan City',
        },
    },
    {
        keywords: ['downtown', 'city proper'],
        location: {
            lat: 8.9492,
            lng: 125.5436,
            label: 'Butuan City Proper',
        },
    },
];

function normalizeAddressText(address) {
    return String(address || '')
        .toLowerCase()
        .replace(/[^\w\s,.-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function toNumber(value) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : null;
}

function buildSearchQuery(address) {
    if (!address) {
        return '';
    }

    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
        return '';
    }

    return /philippines/i.test(trimmedAddress) ? trimmedAddress : `${trimmedAddress}, Philippines`;
}

function buildSearchQueries(address) {
    const normalizedAddress = normalizeAddressText(address);
    const addressParts = normalizedAddress
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    const queries = new Set();

    function addQuery(value) {
        const query = buildSearchQuery(value);

        if (query) {
            queries.add(query);
        }
    }

    addQuery(address);
    addQuery(`${address}, Butuan City, Agusan del Norte`);
    addQuery(`${address}, Caraga`);

    if (!normalizedAddress.includes('butuan')) {
        addQuery(`${address}, Butuan City`);
        addQuery(`${address}, Butuan City, Caraga`);
    }

    if (addressParts.length > 1) {
        addQuery(addressParts.slice(0, -1).join(', '));
        addQuery(addressParts.at(-1));
    }

    if (addressParts.length > 0) {
        addQuery(`${addressParts[0]}, Butuan City, Agusan del Norte`);
    }

    return [...queries];
}

function lookupLocalAddressHint(address) {
    const normalizedAddress = normalizeAddressText(address);

    if (!normalizedAddress) {
        return null;
    }

    const match = LOCAL_ADDRESS_HINTS.find((hint) => hint.keywords.some((keyword) => normalizedAddress.includes(keyword)));

    if (match) {
        return {
            ...match.location,
            label: match.location.label,
            source: 'local-hint',
        };
    }

    if (normalizedAddress.includes('butuan') || normalizedAddress.includes('caraga') || normalizedAddress.includes('agusan')) {
        return {
            ...BUTUAN_CITY_LOCATION,
            label: address || BUTUAN_CITY_LOCATION.label,
            source: 'local-hint',
        };
    }

    return null;
}

export function hasCoordinates(location) {
    return Number.isFinite(location?.lat) && Number.isFinite(location?.lng);
}

export function normalizeCoordinates(location, fallbackLabel = 'Saved location') {
    if (!location) {
        return null;
    }

    const lat = toNumber(location.lat);
    const lng = toNumber(location.lng);

    if (lat === null || lng === null) {
        return null;
    }

    return {
        lat,
        lng,
        label: location.label || fallbackLabel,
        source: location.source || 'saved',
    };
}

export function interpolateLocation(start, end, ratio) {
    if (!hasCoordinates(start) || !hasCoordinates(end)) {
        return null;
    }

    const clampedRatio = Math.max(0, Math.min(ratio, 1));

    return {
        lat: start.lat + (end.lat - start.lat) * clampedRatio,
        lng: start.lng + (end.lng - start.lng) * clampedRatio,
    };
}

export function getCurrentPosition(options = {}) {
    if (typeof window === 'undefined' || !window.navigator?.geolocation) {
        return Promise.resolve(null);
    }

    const { label = 'Customer location', ...geolocationOptions } = options;

    return new Promise((resolve) => {
        window.navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                resolve({
                    lat: coords.latitude,
                    lng: coords.longitude,
                    source: 'device',
                    label,
                });
            },
            () => resolve(null),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
                ...geolocationOptions,
            },
        );
    });
}

export async function geocodeAddress(address, signal) {
    const queries = buildSearchQueries(address);

    if (!queries.length || typeof window === 'undefined' || typeof window.fetch !== 'function') {
        return null;
    }

    for (const query of queries) {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('limit', '1');
        url.searchParams.set('countrycodes', 'ph');
        url.searchParams.set('viewbox', '125.44,9.03,125.64,8.86');
        url.searchParams.set('bounded', '1');
        url.searchParams.set('q', query);

        try {
            const response = await window.fetch(url, {
                signal,
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                continue;
            }

            const results = await response.json();
            const topResult = Array.isArray(results) ? results[0] : null;
            const location = normalizeCoordinates(
                {
                    lat: topResult?.lat,
                    lng: topResult?.lon,
                    source: 'address',
                    label: address,
                },
                address,
            );

            if (location) {
                return location;
            }
        } catch {
            continue;
        }
    }

    const localHint = lookupLocalAddressHint(address);

    return localHint ? normalizeCoordinates(localHint, address) : null;
}
