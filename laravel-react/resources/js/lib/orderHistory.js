const ORDER_HISTORY_KEY = 'inalog-silog-order-history';
const ACTIVE_ORDER_KEY = 'inalog-silog-active-order';
const DELIVERY_ORDERS_KEY = 'inalog-silog-delivery-orders';

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

export function normalizeOrderMode(value) {
    const normalizedMode = toText(value, 'delivery').toLowerCase();

    if (normalizedMode === 'pickup' || normalizedMode === 'pick-up' || normalizedMode === 'pick up') {
        return 'pickup';
    }

    return 'delivery';
}

function readJson(key, fallbackValue) {
    if (!canUseStorage()) {
        return fallbackValue;
    }

    try {
        const rawValue = window.localStorage.getItem(key);

        if (!rawValue) {
            return fallbackValue;
        }

        return JSON.parse(rawValue);
    } catch {
        return fallbackValue;
    }
}

function writeJson(key, value) {
    if (!canUseStorage()) {
        return value;
    }

    window.localStorage.setItem(key, JSON.stringify(value));

    return value;
}

function isCompletedOrderStatus(status) {
    const normalizedStatus = String(status || '').toLowerCase();

    return normalizedStatus.includes('deliver') || normalizedStatus.includes('ready for pick-up');
}

function normalizeOrderEntry(orderEntry) {
    if (!orderEntry?.id) {
        return null;
    }

    const mode = normalizeOrderMode(orderEntry.mode);
    const assignedRider = mode === 'delivery' ? toText(orderEntry.assignedRider, '') : 'Store Release Team';
    const hasAssignedRider = Boolean(assignedRider);

    return {
        ...orderEntry,
        id: toText(orderEntry.id, ''),
        mode,
        status: toText(orderEntry.status, mode === 'delivery' ? 'Waiting rider assignment' : 'Preparing order'),
        customerName: toText(orderEntry.customerName, 'Customer order'),
        address: toText(orderEntry.address, 'No delivery address saved'),
        paymentMethod: toText(orderEntry.paymentMethod, 'Payment not set'),
        riderName:
            mode === 'delivery'
                ? hasAssignedRider
                    ? toText(orderEntry.riderName, assignedRider)
                    : 'Waiting for rider'
                : toText(orderEntry.riderName, 'Store Release Team'),
        riderVehicle:
            mode === 'delivery'
                ? hasAssignedRider
                    ? toText(orderEntry.riderVehicle, 'Vehicle not set')
                    : 'Waiting for vehicle'
                : toText(orderEntry.riderVehicle, 'Counter release'),
        assignedRider,
    };
}

function sortOrders(entries) {
    return [...entries].sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
}

function upsertOrder(entries, orderEntry, limit = null) {
    const normalizedOrder = normalizeOrderEntry(orderEntry);

    if (!normalizedOrder) {
        return Array.isArray(entries) ? entries : [];
    }

    const nextEntries = sortOrders([normalizedOrder, ...(Array.isArray(entries) ? entries : []).filter((entry) => entry?.id !== normalizedOrder.id)]);

    return limit ? nextEntries.slice(0, limit) : nextEntries;
}

function writeOrderHistory(entries) {
    return writeJson(ORDER_HISTORY_KEY, entries);
}

function writeDeliveryOrders(entries) {
    return writeJson(DELIVERY_ORDERS_KEY, entries);
}

function syncDeliveryOrders(orderEntry) {
    const normalizedOrder = normalizeOrderEntry(orderEntry);

    if (!normalizedOrder || normalizedOrder.mode !== 'delivery') {
        return readDeliveryOrders();
    }

    const currentEntries = readDeliveryOrders();

    if (isCompletedOrderStatus(normalizedOrder.status)) {
        return writeDeliveryOrders(currentEntries.filter((entry) => entry.id !== normalizedOrder.id));
    }

    return writeDeliveryOrders(upsertOrder(currentEntries, normalizedOrder));
}

export function readOrderHistory() {
    const parsedValue = readJson(ORDER_HISTORY_KEY, []);

    return Array.isArray(parsedValue) ? parsedValue.map((entry) => normalizeOrderEntry(entry)).filter(Boolean) : [];
}

export function saveOrderHistoryEntry(orderEntry) {
    const nextEntries = upsertOrder(readOrderHistory(), orderEntry, 8);

    writeOrderHistory(nextEntries);

    return nextEntries;
}

export function readDeliveryOrders() {
    const parsedValue = readJson(DELIVERY_ORDERS_KEY, []);

    return Array.isArray(parsedValue) ? parsedValue.map((entry) => normalizeOrderEntry(entry)).filter(Boolean) : [];
}

export function readActiveOrder() {
    const parsedValue = normalizeOrderEntry(readJson(ACTIVE_ORDER_KEY, null));

    return parsedValue?.id ? parsedValue : null;
}

export function saveActiveOrder(orderEntry) {
    const normalizedOrder = normalizeOrderEntry(orderEntry);

    if (!normalizedOrder || !canUseStorage()) {
        return null;
    }

    writeJson(ACTIVE_ORDER_KEY, normalizedOrder);
    saveOrderHistoryEntry(normalizedOrder);
    syncDeliveryOrders(normalizedOrder);

    return normalizedOrder;
}

export function updateStoredOrder(orderId, changes, options = {}) {
    const currentOrder =
        readDeliveryOrders().find((order) => order.id === orderId) ||
        readOrderHistory().find((order) => order.id === orderId) ||
        (readActiveOrder()?.id === orderId ? readActiveOrder() : null);

    if (!currentOrder) {
        return null;
    }

    const nextOrder = normalizeOrderEntry({
        ...currentOrder,
        ...changes,
    });

    if (!nextOrder) {
        return null;
    }

    saveOrderHistoryEntry(nextOrder);
    syncDeliveryOrders(nextOrder);

    const currentActiveOrder = readActiveOrder();

    if (options.setAsActive || currentActiveOrder?.id === orderId) {
        writeJson(ACTIVE_ORDER_KEY, nextOrder);
    }

    return nextOrder;
}

export function assignDeliveryOrder(orderId, riderSession) {
    if (!riderSession?.riderName) {
        return null;
    }

    const claimedAt = new Date().toISOString();

    return updateStoredOrder(
        orderId,
        {
            status: 'Rider assigned',
            assignedRider: riderSession.riderName,
            riderName: riderSession.riderName,
            riderVehicle: riderSession.vehicle,
            riderCode: riderSession.riderCode,
            riderZone: riderSession.zone,
            claimedAt,
            updatedAt: claimedAt,
        },
        { setAsActive: true },
    );
}

export function clearActiveOrder() {
    if (!canUseStorage()) {
        return;
    }

    window.localStorage.removeItem(ACTIVE_ORDER_KEY);
}
