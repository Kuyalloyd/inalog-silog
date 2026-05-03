const ADMIN_ACTIVITY_LOG_KEY = 'inalog-silog-admin-activity-log';
const ACTIVITY_LIMIT = 80;

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function toText(value, fallback = '') {
    if (typeof value !== 'string') {
        return fallback;
    }

    const normalizedValue = value.trim();

    return normalizedValue || fallback;
}

function toTimestamp(value) {
    const timestamp = new Date(value || '').getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeActivityEntry(entry) {
    const occurredAt = entry?.occurredAt || entry?.createdAt || new Date().toISOString();

    return {
        key: toText(entry?.key, `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        type: toText(entry?.type, 'System'),
        title: toText(entry?.title, 'Activity'),
        detail: toText(entry?.detail, 'No extra detail.'),
        actor: toText(entry?.actor, 'System'),
        tone: toText(entry?.tone, 'ink'),
        occurredAt,
    };
}

function sortActivities(entries) {
    return [...entries].sort((left, right) => toTimestamp(right.occurredAt) - toTimestamp(left.occurredAt));
}

function makeActivitySignature(entry) {
    const timeBucket = new Date(entry.occurredAt || '').toISOString().slice(0, 16);

    return [entry.type, entry.title, entry.detail, entry.actor, timeBucket].join('|');
}

export function readAdminActivityLog() {
    if (!canUseStorage()) {
        return [];
    }

    try {
        const rawValue = window.localStorage.getItem(ADMIN_ACTIVITY_LOG_KEY);

        if (!rawValue) {
            return [];
        }

        const parsedValue = JSON.parse(rawValue);

        return Array.isArray(parsedValue) ? sortActivities(parsedValue.map((entry) => normalizeActivityEntry(entry))) : [];
    } catch {
        return [];
    }
}

export function logAdminActivity(entry) {
    const nextEntry = normalizeActivityEntry(entry);

    if (!canUseStorage()) {
        return nextEntry;
    }

    const nextLog = sortActivities([nextEntry, ...readAdminActivityLog()]).slice(0, ACTIVITY_LIMIT);
    window.localStorage.setItem(ADMIN_ACTIVITY_LOG_KEY, JSON.stringify(nextLog));

    return nextEntry;
}

export function buildAdminActivityFeed({ appointments = [], deliveries = [], riders = [], storedActivities = [] }) {
    const derivedActivities = [
        ...deliveries.map((delivery) =>
            normalizeActivityEntry({
                key: `delivery-activity:${delivery.key || delivery.orderCode}`,
                type: 'Delivery',
                title: `${delivery.customerName || 'Customer'} placed ${delivery.orderMode || 'delivery'} order ${delivery.orderCode || ''}`.trim(),
                detail: [delivery.status, delivery.paymentMethod, delivery.assignedRider].filter(Boolean).join(' | '),
                actor: delivery.customerName || 'Customer',
                tone: delivery.assignedRider && delivery.assignedRider !== 'Unassigned' ? 'green' : 'gold',
                occurredAt: delivery.createdAt || new Date().toISOString(),
            }),
        ),
        ...deliveries
            .filter((delivery) => delivery.assignedRider && delivery.assignedRider !== 'Unassigned')
            .map((delivery) =>
                normalizeActivityEntry({
                    key: `delivery-claim:${delivery.key || delivery.orderCode}:${delivery.claimedAt || delivery.updatedAt || delivery.createdAt || 'now'}`,
                    type: 'Rider',
                    title: 'Rider claimed delivery order',
                    detail: [delivery.orderCode, delivery.customerName, delivery.address, delivery.paymentMethod].filter(Boolean).join(' | '),
                    actor: delivery.assignedRider,
                    tone: 'green',
                    occurredAt: delivery.claimedAt || delivery.updatedAt || delivery.createdAt || new Date().toISOString(),
                }),
            ),
        ...deliveries
            .filter((delivery) => delivery.assignedRider && delivery.assignedRider !== 'Unassigned' && String(delivery.status || '').toLowerCase().includes('deliver'))
            .map((delivery) =>
                normalizeActivityEntry({
                    key: `delivery-complete:${delivery.key || delivery.orderCode}:${delivery.deliveredAt || delivery.updatedAt || delivery.createdAt || 'now'}`,
                    type: 'Rider',
                    title: 'Rider completed delivery',
                    detail: [delivery.orderCode, delivery.customerName, delivery.address, delivery.paymentMethod].filter(Boolean).join(' | '),
                    actor: delivery.assignedRider,
                    tone: 'green',
                    occurredAt: delivery.deliveredAt || delivery.updatedAt || delivery.createdAt || new Date().toISOString(),
                }),
            ),
        ...appointments.map((appointment) =>
            normalizeActivityEntry({
                key: `appointment-activity:${appointment.key}`,
                type: 'Booking',
                title: `${appointment.type || 'Booking'} for ${appointment.customerName || 'Guest'}`,
                detail: [appointment.status, appointment.scheduleDate, appointment.assignedTo].filter(Boolean).join(' | '),
                actor: appointment.customerName || 'Guest',
                tone: appointment.assignedTo && appointment.assignedTo !== 'Unassigned' ? 'green' : 'gold',
                occurredAt: appointment.createdAt || appointment.scheduleDate || new Date().toISOString(),
            }),
        ),
        ...riders
            .filter((rider) => rider.status === 'On shift' || rider.assignedDeliveries > 0 || rider.assignedBookings > 0)
            .map((rider) =>
                normalizeActivityEntry({
                    key: `rider-activity:${rider.name}:${rider.startedAt || rider.currentCustomer || rider.status}`,
                    type: 'Rider',
                    title:
                        rider.status === 'On shift'
                            ? `${rider.name} is on shift`
                            : `${rider.name} has active assignments`,
                    detail: [rider.vehicle, rider.zone, rider.currentCustomer].filter(Boolean).join(' | '),
                    actor: rider.name,
                    tone: rider.status === 'On shift' ? 'green' : 'ink',
                    occurredAt: rider.startedAt || new Date().toISOString(),
                }),
            ),
    ];

    const mergedActivities = sortActivities([...storedActivities.map((entry) => normalizeActivityEntry(entry)), ...derivedActivities]);
    const seenSignatures = new Set();

    return mergedActivities.filter((entry) => {
        const signature = makeActivitySignature(entry);

        if (seenSignatures.has(signature)) {
            return false;
        }

        seenSignatures.add(signature);
        return true;
    });
}
