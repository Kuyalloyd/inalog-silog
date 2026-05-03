const RIDER_SESSION_KEY = 'inalog-silog-rider-session';

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function toText(value, fallback) {
    if (typeof value !== 'string') {
        return fallback;
    }

    const normalizedValue = value.trim();

    return normalizedValue || fallback;
}

function fallbackRiderNameFromEmail(email) {
    if (typeof email !== 'string' || !email.trim()) {
        return '';
    }

    return email
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeRiderSession(value) {
    const riderName = toText(value?.riderName, '');

    if (!riderName) {
        return null;
    }

    return {
        riderName,
        riderCode: toText(value?.riderCode, 'RDR-204'),
        vehicle: toText(value?.vehicle, 'Motorbike'),
        zone: toText(value?.zone, 'Butuan Central Route'),
        contactNumber: toText(value?.contactNumber, '0917 000 0000'),
        startedAt: value?.startedAt || new Date().toISOString(),
    };
}

function buildRiderSessionDraft(member, overrides = {}) {
    const metadata = member?.user_metadata || {};

    return {
        riderName: overrides.riderName || metadata.full_name || fallbackRiderNameFromEmail(member?.email),
        riderCode: overrides.riderCode || metadata.rider_code,
        vehicle: overrides.vehicle || metadata.vehicle,
        zone: overrides.zone || metadata.zone,
        contactNumber: overrides.contactNumber || metadata.contact_number,
    };
}

export function readRiderSession() {
    if (!canUseStorage()) {
        return null;
    }

    try {
        const rawValue = window.localStorage.getItem(RIDER_SESSION_KEY);

        if (!rawValue) {
            return null;
        }

        return normalizeRiderSession(JSON.parse(rawValue));
    } catch {
        return null;
    }
}

export function saveRiderSession(values) {
    if (!canUseStorage()) {
        return null;
    }

    const session = normalizeRiderSession({
        ...values,
        startedAt: new Date().toISOString(),
    });

    if (!session) {
        return null;
    }

    window.localStorage.setItem(RIDER_SESSION_KEY, JSON.stringify(session));

    return session;
}

export function saveRiderSessionFromMember(member, overrides = {}) {
    if (!canUseStorage()) {
        return null;
    }

    const session = normalizeRiderSession({
        ...buildRiderSessionDraft(member, overrides),
        startedAt: new Date().toISOString(),
    });

    if (!session) {
        return null;
    }

    window.localStorage.setItem(RIDER_SESSION_KEY, JSON.stringify(session));

    return session;
}

export function clearRiderSession() {
    if (!canUseStorage()) {
        return;
    }

    window.localStorage.removeItem(RIDER_SESSION_KEY);
}
