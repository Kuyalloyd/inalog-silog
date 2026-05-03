import { readAdminActivityLog } from './adminActivityLog';
import { fetchAdminAppointments } from './adminAppointments';
import { normalizeOrderMode, readActiveOrder, readDeliveryOrders, readOrderHistory, updateStoredOrder } from './orderHistory';
import { readRiderSession } from './riderSession';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const DELIVERY_ASSIGNMENTS_KEY = 'inalog-silog-admin-delivery-assignments';

// Only use real registered riders - remove demo riders to show only actual accounts
const defaultRiders = [];

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

function toAmount(value) {
    const normalizedValue = String(value ?? '').replace(/[^0-9.]/g, '');
    const parsedValue = Number(normalizedValue);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function toTimestamp(value) {
    const timestamp = new Date(value || '').getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function extractEmailFromText(value) {
    const match = String(value || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

    return match ? match[0].toLowerCase() : '';
}

function normalizeAssignedRider(value) {
    const riderName = toText(value, '');

    if (!riderName) {
        return '';
    }

    const normalizedName = riderName.toLowerCase();

    if (normalizedName === 'waiting for rider' || normalizedName === 'unassigned') {
        return '';
    }

    return riderName;
}

function hasAssignedRider(value) {
    return Boolean(normalizeAssignedRider(value));
}

function pickFirstText(values, fallback = '') {
    for (const value of values) {
        if (typeof value === 'string') {
            const normalizedValue = value.trim();

            if (normalizedValue) {
                return normalizedValue;
            }
        }
    }

    return fallback;
}

function pickFirstNumber(values, fallback = 0) {
    for (const value of values) {
        const parsedValue = Number(value);

        if (Number.isFinite(parsedValue) && parsedValue > 0) {
            return parsedValue;
        }
    }

    return fallback;
}

function isPlaceholderText(value, placeholders = []) {
    const normalizedValue = String(value || '')
        .trim()
        .toLowerCase();

    return !normalizedValue || placeholders.includes(normalizedValue);
}

function pickMeaningfulText(values, placeholders = [], fallback = '') {
    for (const value of values) {
        if (typeof value !== 'string') {
            continue;
        }

        const normalizedValue = value.trim();

        if (!normalizedValue) {
            continue;
        }

        if (placeholders.includes(normalizedValue.toLowerCase())) {
            continue;
        }

        return normalizedValue;
    }

    return fallback;
}

function createBaseRiderRecord(values = {}) {
    return {
        name: values.name || 'Rider',
        code: values.code || 'No code',
        vehicle: values.vehicle || 'Vehicle not set',
        zone: values.zone || 'Zone not set',
        phone: values.phone || 'No contact',
        status: values.status || 'Available',
        startedAt: values.startedAt || '',
    };
}

function parseRiderActivity(activity) {
    if (String(activity?.type || '').toLowerCase() !== 'rider') {
        return null;
    }

    const detailParts = String(activity?.detail || '')
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean);
    const titleText = String(activity?.title || '').toLowerCase();
    const riderName = toText(activity?.actor, 'Rider');

    return createBaseRiderRecord({
        name: riderName,
        code: toText(detailParts[1], 'No code'),
        vehicle: toText(detailParts[2], 'Vehicle not set'),
        zone: toText(detailParts[3], 'Zone not set'),
        phone: toText(detailParts[4], 'No contact'),
        status: titleText.includes('signed in') ? 'On shift' : titleText.includes('account created') ? 'Registered' : 'Available',
        startedAt: titleText.includes('signed in') ? activity?.occurredAt || '' : '',
    });
}

function parseCustomerActivity(activity) {
    if (String(activity?.type || '').toLowerCase() !== 'customer') {
        return null;
    }

    const detailParts = String(activity?.detail || ' ')
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean);

    return {
        name: toText(activity?.actor, 'Customer'),
        email: toText(detailParts[0], 'No email provided'),
        phone: toText(detailParts[1], 'No phone provided'),
        address: [detailParts[2], detailParts[3]].filter(Boolean).join(', ') || 'No address saved',
        occurredAt: activity?.occurredAt || '',
        title: toText(activity?.title, 'Customer activity'),
    };
}

function mergeRiderProfile(currentRecord, nextRecord) {
    const current = currentRecord || createBaseRiderRecord({ name: nextRecord?.name || 'Rider' });
    const next = nextRecord || {};

    return {
        ...current,
        name: next.name || current.name,
        code: pickMeaningfulText([next.code, current.code], ['no code'], 'No code'),
        vehicle: pickMeaningfulText([next.vehicle, current.vehicle], ['vehicle not set'], 'Vehicle not set'),
        zone: pickMeaningfulText([next.zone, current.zone], ['zone not set'], 'Zone not set'),
        phone: pickMeaningfulText([next.phone, current.phone], ['no contact'], 'No contact'),
        status:
            next.status === 'On shift'
                ? 'On shift'
                : current.status === 'On shift'
                  ? 'On shift'
                  : next.status || current.status || 'Available',
        startedAt: pickFirstText([next.startedAt, current.startedAt], ''),
    };
}

function readDeliveryAssignmentStore() {
    if (!canUseStorage()) {
        return {};
    }

    try {
        const rawValue = window.localStorage.getItem(DELIVERY_ASSIGNMENTS_KEY);

        if (!rawValue) {
            return {};
        }

        const parsedValue = JSON.parse(rawValue);

        return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
    } catch {
        return {};
    }
}

function writeDeliveryAssignmentStore(value) {
    if (!canUseStorage()) {
        return;
    }

    window.localStorage.setItem(DELIVERY_ASSIGNMENTS_KEY, JSON.stringify(value));
}

function buildDeliveryKey(record) {
    const recordId = record?.order_code ?? record?.reference_code ?? record?.id ?? record?.order_id ?? `fallback-${Date.now()}`;
    const email = toText(record?.email, 'no-email');

    return `delivery:${recordId}:${email}`;
}

function buildLocalDeliveryKey(orderId) {
    return `delivery-local:${orderId}`;
}

function findRiderRecordByName(riderName) {
    const { riderRoster } = createRiderRoster(readAdminActivityLog());

    return riderRoster.find((rider) => rider.name === riderName) || null;
}

function createRiderRoster(storedActivities = []) {
    const riderSession = readRiderSession();
    const riderRosterMap = new Map(defaultRiders.map((rider) => [rider.name, { ...rider, status: 'Available' }]));

    storedActivities.forEach((activity) => {
        const riderActivityRecord = parseRiderActivity(activity);

        if (!riderActivityRecord?.name) {
            return;
        }

        const currentRecord = riderRosterMap.get(riderActivityRecord.name);
        riderRosterMap.set(riderActivityRecord.name, mergeRiderProfile(currentRecord, riderActivityRecord));
    });

    if (riderSession) {
        const sessionRecord = {
            name: riderSession.riderName,
            code: riderSession.riderCode,
            vehicle: riderSession.vehicle,
            zone: riderSession.zone,
            phone: riderSession.contactNumber,
            status: 'On shift',
            startedAt: riderSession.startedAt,
        };
        const currentRecord = riderRosterMap.get(riderSession.riderName);

        riderRosterMap.set(riderSession.riderName, mergeRiderProfile(currentRecord, sessionRecord));
    }

    return {
        riderSession,
        riderRoster: Array.from(riderRosterMap.values()),
    };
}

function getDeliveryRiderOptions(riderRoster, deliveries = []) {
    return Array.from(
        new Set([
            'Unassigned',
            ...riderRoster.map((rider) => rider.name),
            ...deliveries.map((delivery) => delivery.assignedRider).filter(Boolean),
        ]),
    );
}

function mapSupabaseOrder(record) {
    const key = buildDeliveryKey(record);
    const orderItems = Array.isArray(record.order_items) ? record.order_items : [];
    const fallbackRider = normalizeAssignedRider(record.rider_name || record.riderName);
    const claimedAt = record.claimed_at || (fallbackRider ? record.updated_at || record.modified_at || '' : '');

    return {
        key,
        orderCode: toText(record.order_code || record.reference_code || record.id, key.slice(-8).toUpperCase()),
        customerName: toText(record.customer_name, 'Customer order'),
        email: toText(record.email, 'No email provided'),
        phone: toText(record.phone, 'No phone provided'),
        address: toText(record.delivery_address || record.address, 'No delivery address provided'),
        status: toText(record.status, 'Waiting rider assignment'),
        paymentMethod: toText(record.payment_method, 'Payment not set'),
        total: Number(record.total_amount) || 0,
        itemCount: Number(record.item_count) || orderItems.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0),
        orderMode: toText(record.order_mode, 'Delivery'),
        assignedRider: fallbackRider || 'Unassigned',
        riderVehicle: toText(record.rider_vehicle, fallbackRider ? 'Vehicle not set' : 'Waiting for vehicle'),
        riderCode: toText(record.rider_code, ''),
        riderZone: toText(record.rider_zone, ''),
        createdAt: record.created_at || '',
        updatedAt: record.updated_at || record.modified_at || '',
        claimedAt,
        deliveredAt: record.delivered_at || (String(record.status || '').toLowerCase().includes('deliver') ? record.updated_at || record.modified_at || '' : ''),
        notes: toText(record.notes, 'No extra delivery note.'),
    };
}

function mapActiveOrderToDelivery(order) {
    const key = buildLocalDeliveryKey(order.id);

    return {
        key,
        orderId: order.id,
        orderCode: order.id,
        customerName: order.customerName || 'Customer order',
        email: 'Local order only',
        phone: 'No phone saved',
        address: order.address || 'No delivery address provided',
        status: order.status || 'Preparing for dispatch',
        paymentMethod: order.paymentMethod || 'Payment not set',
        total: Number(order.total) || 0,
        itemCount: Number(order.itemCount) || 0,
        orderMode: toText(order.mode, 'Delivery'),
        assignedRider: order.assignedRider || 'Unassigned',
        riderVehicle: order.riderVehicle || 'Waiting for vehicle',
        riderCode: order.riderCode || '',
        riderZone: order.riderZone || '',
        createdAt: order.createdAt || '',
        updatedAt: order.updatedAt || order.claimedAt || '',
        claimedAt: order.claimedAt || '',
        deliveredAt: order.deliveredAt || '',
        notes: order.notes || 'No extra delivery note.',
    };
}

function mapLocalOrderToDelivery(order) {
    const key = buildLocalDeliveryKey(order.id);

    return {
        key,
        orderId: order.id,
        orderCode: order.id,
        customerName: order.customerName || 'Customer order',
        email: order.email || 'Local order only',
        phone: order.phone || 'No phone saved',
        address: order.address || 'No delivery address provided',
        status: order.status || 'Waiting rider assignment',
        paymentMethod: order.paymentMethod || 'Payment not set',
        total: Number(order.total) || 0,
        itemCount: Number(order.itemCount) || 0,
        orderMode: toText(order.mode, 'Delivery'),
        assignedRider: order.assignedRider || 'Unassigned',
        riderVehicle: order.riderVehicle || 'Waiting for vehicle',
        riderCode: order.riderCode || '',
        riderZone: order.riderZone || '',
        createdAt: order.createdAt || '',
        updatedAt: order.updatedAt || order.claimedAt || order.deliveredAt || '',
        claimedAt: order.claimedAt || '',
        deliveredAt: order.deliveredAt || '',
        notes: order.notes || 'No extra delivery note.',
    };
}

function buildLocalDeliveryList() {
    return readDeliveryOrders().map((order) => mapLocalOrderToDelivery(order));
}

function buildLocalDeliveryHistory() {
    return readOrderHistory()
        .filter((order) => toText(order?.mode, '').toLowerCase() === 'delivery')
        .map((order) => mapLocalOrderToDelivery(order));
}

function buildStoredDeliveryList() {
    const localDeliveries = buildLocalDeliveryList();

    if (localDeliveries.length > 0) {
        return localDeliveries;
    }

    const activeOrder = readActiveOrder();
    return activeOrder?.id ? [mapActiveOrderToDelivery(activeOrder)] : [];
}

function buildActivityDeliveryList(activities) {
    const deliveryMap = new Map();

    activities
        .filter((activity) => String(activity?.type || '').toLowerCase() === 'checkout')
        .forEach((activity) => {
            const detailParts = String(activity.detail || '')
                .split('|')
                .map((part) => part.trim())
                .filter(Boolean);
            const titleText = String(activity.title || '').toLowerCase();

            if (titleText.includes('pick-up')) {
                return;
            }

            const orderCode = detailParts[0] || `ACT-${String(activity.key || Date.now()).slice(-6)}`;
            const address = detailParts.slice(2).join(' | ') || 'No delivery address provided';
            const key = `delivery-activity:${activity.key || orderCode}`;

            deliveryMap.set(key, {
                key,
                orderCode,
                customerName: toText(activity.actor, 'Customer order'),
                email: extractEmailFromText(activity.detail) || 'No email provided',
                phone: 'No phone provided',
                address,
                status: 'Logged checkout activity',
                paymentMethod: 'Saved in activity log',
                total: toAmount(detailParts[1]),
                itemCount: 0,
                orderMode: 'Delivery',
                assignedRider: 'Unassigned',
                createdAt: activity.occurredAt || '',
                notes: toText(activity.title, 'Checkout activity'),
            });
        });

    return Array.from(deliveryMap.values());
}

async function fetchCustomerOrders() {
    const { data, error } = await supabase.from('customer_orders').select('*').order('created_at', { ascending: false }).limit(50);

    if (error) {
        throw error;
    }

    return Array.isArray(data) ? data : [];
}

function indexDeliveries(records = []) {
    const deliveryMap = new Map();

    records.forEach((record) => {
        if (!record?.orderCode) {
            return;
        }

        deliveryMap.set(record.orderCode, record);
    });

    return deliveryMap;
}

function mergeDeliveryRecord({ remote, local, history, activity }) {
    const baseRecord = {
        ...(activity || {}),
        ...(history || {}),
        ...(local || {}),
        ...(remote || {}),
    };
    const assignedRider = pickFirstText(
        [
            hasAssignedRider(remote?.assignedRider) ? remote.assignedRider : '',
            hasAssignedRider(local?.assignedRider) ? local.assignedRider : '',
            hasAssignedRider(history?.assignedRider) ? history.assignedRider : '',
        ],
        'Unassigned',
    );
    const createdAt = pickFirstText([remote?.createdAt, local?.createdAt, history?.createdAt, activity?.createdAt], '');
    const updatedAt = pickFirstText([remote?.updatedAt, local?.updatedAt, history?.updatedAt], '');
    const claimedAt = pickFirstText(
        [
            local?.claimedAt,
            history?.claimedAt,
            remote?.claimedAt,
            assignedRider !== 'Unassigned' ? remote?.updatedAt : '',
        ],
        '',
    );

    if (!baseRecord.orderCode) {
        return null;
    }

    return {
        ...baseRecord,
        key: pickFirstText([remote?.key, local?.key, history?.key, activity?.key], `delivery:${baseRecord.orderCode}`),
        orderCode: baseRecord.orderCode,
        customerName: pickFirstText([remote?.customerName, local?.customerName, history?.customerName, activity?.customerName], 'Customer order'),
        email: pickFirstText([remote?.email, local?.email, history?.email, activity?.email], 'No email provided'),
        phone: pickFirstText([remote?.phone, local?.phone, history?.phone, activity?.phone], 'No phone provided'),
        address: pickFirstText([remote?.address, local?.address, history?.address, activity?.address], 'No delivery address provided'),
        status: pickFirstText([remote?.status, local?.status, history?.status, activity?.status], 'Waiting rider assignment'),
        paymentMethod: pickFirstText([remote?.paymentMethod, local?.paymentMethod, history?.paymentMethod, activity?.paymentMethod], 'Payment not set'),
        total: pickFirstNumber([remote?.total, local?.total, history?.total, activity?.total], 0),
        itemCount: pickFirstNumber([remote?.itemCount, local?.itemCount, history?.itemCount, activity?.itemCount], 0),
        orderMode: pickFirstText([remote?.orderMode, local?.orderMode, history?.orderMode, activity?.orderMode], 'Delivery'),
        assignedRider,
        riderVehicle: pickMeaningfulText(
            [remote?.riderVehicle, local?.riderVehicle, history?.riderVehicle],
            ['waiting for vehicle', 'vehicle not set'],
            assignedRider !== 'Unassigned' ? 'Vehicle not set' : 'Waiting for vehicle',
        ),
        riderCode: pickMeaningfulText([remote?.riderCode, local?.riderCode, history?.riderCode], ['no code'], ''),
        riderZone: pickMeaningfulText([remote?.riderZone, local?.riderZone, history?.riderZone], ['zone not set'], ''),
        createdAt,
        updatedAt,
        claimedAt,
        deliveredAt: pickFirstText(
            [
                local?.deliveredAt,
                history?.deliveredAt,
                remote?.deliveredAt,
                String(baseRecord.status || '').toLowerCase().includes('deliver') ? remote?.updatedAt || local?.updatedAt || history?.updatedAt || '' : '',
            ],
            '',
        ),
        notes: pickFirstText([remote?.notes, local?.notes, history?.notes, activity?.notes], 'No extra delivery note.'),
    };
}

function mergeDeliveryCollections({ remote = [], local = [], history = [], activity = [] }) {
    const remoteIndex = indexDeliveries(remote);
    const localIndex = indexDeliveries(local);
    const historyIndex = indexDeliveries(history);
    const activityIndex = indexDeliveries(activity);
    const deliveryKeys = new Set([...remoteIndex.keys(), ...localIndex.keys(), ...historyIndex.keys(), ...activityIndex.keys()]);

    return Array.from(deliveryKeys)
        .map((orderCode) =>
            mergeDeliveryRecord({
                remote: remoteIndex.get(orderCode),
                local: localIndex.get(orderCode),
                history: historyIndex.get(orderCode),
                activity: activityIndex.get(orderCode),
            }),
        )
        .filter((delivery) => delivery && normalizeOrderMode(delivery.orderMode) === 'delivery')
        .sort((left, right) => toTimestamp(right.claimedAt || right.updatedAt || right.createdAt) - toTimestamp(left.claimedAt || left.updatedAt || left.createdAt));
}

function buildCustomerDirectory(appointments, deliveries, activities = []) {
    const customerMap = new Map();

    function updateCustomerActivity(customer, values) {
        const nextActivityAt = values.activityAt || '';

        if (toTimestamp(nextActivityAt) >= toTimestamp(customer.latestActivityAt || '')) {
            customer.latestActivityAt = nextActivityAt;
            customer.latestActivityLabel = values.activityLabel || customer.latestActivityLabel || customer.latestSource;
        }

        if (toTimestamp(values.lastDeliveryAt || '') >= toTimestamp(customer.lastDeliveryAt || '')) {
            customer.lastDeliveryAt = values.lastDeliveryAt || customer.lastDeliveryAt;
            customer.latestOrderStatus = values.latestOrderStatus || customer.latestOrderStatus;
            customer.latestOrderCode = values.latestOrderCode || customer.latestOrderCode;
        }
    }

    function ensureCustomer(key, values) {
        const existingCustomer = customerMap.get(key) || {
            key,
            name: values.name,
            email: values.email,
            phone: values.phone || 'No phone provided',
            address: values.address || 'No address saved',
            bookings: 0,
            deliveries: 0,
            latestSource: values.latestSource || 'System record',
            assignedRider: values.assignedRider || 'Not assigned',
            latestActivityAt: values.latestActivityAt || '',
            latestActivityLabel: values.latestActivityLabel || values.latestSource || 'System record',
            latestOrderStatus: values.latestOrderStatus || 'No order yet',
            latestOrderCode: values.latestOrderCode || 'No order yet',
            lastDeliveryAt: values.lastDeliveryAt || '',
            assignedRider: values.assignedRider || 'Not assigned',
        };

        customerMap.set(key, {
            ...existingCustomer,
            name: values.name || existingCustomer.name,
            email: values.email || existingCustomer.email,
            phone: values.phone || existingCustomer.phone,
            address: values.address || existingCustomer.address,
            latestSource: values.latestSource || existingCustomer.latestSource,
            assignedRider: values.assignedRider || existingCustomer.assignedRider,
            latestActivityAt: values.latestActivityAt || existingCustomer.latestActivityAt,
            latestActivityLabel: values.latestActivityLabel || existingCustomer.latestActivityLabel,
            latestOrderStatus: values.latestOrderStatus || existingCustomer.latestOrderStatus,
            latestOrderCode: values.latestOrderCode || existingCustomer.latestOrderCode,
            lastDeliveryAt: values.lastDeliveryAt || existingCustomer.lastDeliveryAt,
        });

        return customerMap.get(key);
    }

    appointments.forEach((appointment) => {
        const key = appointment.email !== 'No email provided' ? appointment.email : `${appointment.customerName}:${appointment.type}`;
        const customer = ensureCustomer(key, {
            name: appointment.customerName,
            email: appointment.email,
            address: appointment.locationLabel,
            latestSource: appointment.type,
            assignedRider: appointment.assignedTo,
            latestActivityAt: appointment.createdAt || appointment.scheduleDate || '',
            latestActivityLabel: appointment.type,
        });

        customer.bookings += 1;
        updateCustomerActivity(customer, {
            activityAt: appointment.createdAt || appointment.scheduleDate || '',
            activityLabel: appointment.type,
        });
    });

    deliveries.forEach((delivery) => {
        const key = delivery.email !== 'No email provided' ? delivery.email : `${delivery.customerName}:${delivery.orderCode}`;
        const customer = ensureCustomer(key, {
            name: delivery.customerName,
            email: delivery.email,
            phone: delivery.phone,
            address: delivery.address,
            latestSource: 'Delivery order',
            assignedRider: delivery.assignedRider,
            latestActivityAt: delivery.deliveredAt || delivery.claimedAt || delivery.createdAt || '',
            latestActivityLabel: delivery.status || 'Delivery order',
            latestOrderStatus: delivery.status || 'Delivery order',
            latestOrderCode: delivery.orderCode || 'No order yet',
            lastDeliveryAt: delivery.deliveredAt || delivery.claimedAt || delivery.createdAt || '',
        });

        customer.deliveries += 1;
        updateCustomerActivity(customer, {
            activityAt: delivery.deliveredAt || delivery.claimedAt || delivery.createdAt || '',
            activityLabel: delivery.status || 'Delivery order',
            lastDeliveryAt: delivery.deliveredAt || delivery.claimedAt || delivery.createdAt || '',
            latestOrderStatus: delivery.status || 'Delivery order',
            latestOrderCode: delivery.orderCode || 'No order yet',
        });
    });

    activities.forEach((activity) => {
        const activityType = String(activity?.type || '').toLowerCase();

        if (activityType !== 'customer' && activityType !== 'checkout') {
            return;
        }

        const detailParts = String(activity.detail || '')
            .split('|')
            .map((part) => part.trim())
            .filter(Boolean);
        const customerActivityRecord = parseCustomerActivity(activity);
        const email = extractEmailFromText(activity.detail) || customerActivityRecord?.email || '';
        const address = activityType === 'checkout' ? detailParts.slice(2).join(' | ') : '';
        const key = email || `${activityType}:${activity.actor}`;
        const customer = ensureCustomer(key, {
            name: toText(activity.actor, 'Customer'),
            email: email || 'No email provided',
            phone: customerActivityRecord?.phone || 'No phone provided',
            address: address || customerActivityRecord?.address || 'No address saved',
            latestSource: toText(activity.title, 'Activity log'),
            latestActivityAt: activity.occurredAt || '',
            latestActivityLabel: toText(activity.title, 'Activity log'),
        });

        if (activityType === 'checkout') {
            customer.deliveries += 1;
            updateCustomerActivity(customer, {
                activityAt: activity.occurredAt || '',
                activityLabel: toText(activity.title, 'Checkout activity'),
            });
        } else {
            updateCustomerActivity(customer, {
                activityAt: activity.occurredAt || '',
                activityLabel: toText(activity.title, 'Customer activity'),
            });
        }
    });

    return Array.from(customerMap.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function buildRiderDirectory(riderRoster, deliveries, appointments, activities = []) {
    const riderMap = new Map();

    riderRoster.forEach((rider) => {
        riderMap.set(rider.name, {
            ...rider,
            assignedDeliveries: 0,
            assignedBookings: 0,
            currentCustomer: 'No live stop yet',
            lastClaimedAt: '',
            lastDeliveredAt: '',
            lastOrderCode: 'No claimed order yet',
        });
    });

    deliveries.forEach((delivery) => {
        if (!delivery.assignedRider || delivery.assignedRider === 'Unassigned' || delivery.assignedRider === 'Store Release Team') {
            return;
        }

        const currentRider = riderMap.get(delivery.assignedRider) || {
            name: delivery.assignedRider,
            code: 'No code',
            vehicle: 'Vehicle not set',
            zone: 'Zone not set',
            phone: 'No contact',
            status: 'Assigned',
            assignedDeliveries: 0,
            assignedBookings: 0,
            currentCustomer: 'No live stop yet',
            lastClaimedAt: '',
            lastDeliveredAt: '',
            lastOrderCode: 'No claimed order yet',
        };

        currentRider.assignedDeliveries += 1;
        currentRider.code = pickMeaningfulText([delivery.riderCode, currentRider.code], ['no code'], 'No code');
        currentRider.vehicle = pickMeaningfulText([delivery.riderVehicle, currentRider.vehicle], ['waiting for vehicle', 'vehicle not set'], 'Vehicle not set');
        currentRider.zone = pickMeaningfulText([delivery.riderZone, currentRider.zone], ['zone not set'], 'Zone not set');

        if (toTimestamp(delivery.claimedAt || '') >= toTimestamp(currentRider.lastClaimedAt || '')) {
            currentRider.lastClaimedAt = delivery.claimedAt || currentRider.lastClaimedAt;
            currentRider.lastOrderCode = delivery.orderCode || currentRider.lastOrderCode;
            currentRider.currentCustomer = delivery.customerName || currentRider.currentCustomer;
        }

        if (toTimestamp(delivery.deliveredAt || '') >= toTimestamp(currentRider.lastDeliveredAt || '')) {
            currentRider.lastDeliveredAt = delivery.deliveredAt || currentRider.lastDeliveredAt;
            currentRider.lastOrderCode = delivery.orderCode || currentRider.lastOrderCode;
            currentRider.currentCustomer = delivery.customerName || currentRider.currentCustomer;
        }

        if (currentRider.status !== 'On shift') {
            currentRider.status = 'Assigned';
        }

        riderMap.set(delivery.assignedRider, currentRider);
    });

    appointments.forEach((appointment) => {
        if (!appointment.assignedTo || !appointment.assignedTo.toLowerCase().startsWith('rider ')) {
            return;
        }

        const currentRider = riderMap.get(appointment.assignedTo) || {
            name: appointment.assignedTo,
            code: 'No code',
            vehicle: 'Vehicle not set',
            zone: 'Zone not set',
            phone: 'No contact',
            status: 'Assigned',
            assignedDeliveries: 0,
            assignedBookings: 0,
            currentCustomer: 'No live stop yet',
            lastClaimedAt: '',
            lastDeliveredAt: '',
            lastOrderCode: 'No claimed order yet',
        };

        currentRider.assignedBookings += 1;
        riderMap.set(appointment.assignedTo, currentRider);
    });

    activities
        .filter((activity) => String(activity?.type || '').toLowerCase() === 'rider')
        .forEach((activity) => {
            const riderActivityRecord = parseRiderActivity(activity);
            const riderName = riderActivityRecord?.name || toText(activity.actor, 'Rider');
            const currentRider = riderMap.get(riderName) || {
                ...createBaseRiderRecord({ name: riderName }),
                assignedDeliveries: 0,
                assignedBookings: 0,
                currentCustomer: 'No live stop yet',
                lastClaimedAt: '',
                lastDeliveredAt: '',
                lastOrderCode: 'No claimed order yet',
            };
            const detailParts = String(activity.detail || '')
                .split('|')
                .map((part) => part.trim())
                .filter(Boolean);
            const activityTitle = String(activity.title || '').toLowerCase();

            if (String(activity.title || '').toLowerCase().includes('signed in')) {
                currentRider.status = 'On shift';
            }

            if (activityTitle.includes('claimed delivery order')) {
                currentRider.lastClaimedAt = activity.occurredAt || currentRider.lastClaimedAt;
                currentRider.lastOrderCode = detailParts[0] || currentRider.lastOrderCode;
                currentRider.currentCustomer = detailParts[1] || currentRider.currentCustomer;
            }

            if (activityTitle.includes('completed delivery')) {
                currentRider.lastDeliveredAt = activity.occurredAt || currentRider.lastDeliveredAt;
                currentRider.lastOrderCode = detailParts[0] || currentRider.lastOrderCode;
                currentRider.currentCustomer = detailParts[1] || currentRider.currentCustomer;
            }

            const mergedProfile = mergeRiderProfile(currentRider, riderActivityRecord || { name: riderName });

            riderMap.set(riderName, {
                ...currentRider,
                ...mergedProfile,
                assignedDeliveries: currentRider.assignedDeliveries,
                assignedBookings: currentRider.assignedBookings,
                currentCustomer: currentRider.currentCustomer,
            });
        });

    return Array.from(riderMap.values()).sort((left, right) => left.name.localeCompare(right.name));
}

export async function fetchAdminPanelData() {
    const storedActivities = readAdminActivityLog();
    const appointmentResult = await fetchAdminAppointments();
    const { riderRoster } = createRiderRoster(storedActivities);
    const warnings = [];
    const localDeliveries = buildLocalDeliveryList();
    const localDeliveryHistory = buildLocalDeliveryHistory();
    const activityDeliveries = buildActivityDeliveryList(storedActivities);
    let deliveries = [];

    if (!isSupabaseConfigured || !supabase) {
        deliveries = mergeDeliveryCollections({
            local: localDeliveries,
            history: localDeliveryHistory.length > 0 ? localDeliveryHistory : buildStoredDeliveryList(),
            activity: activityDeliveries,
        });

        if (deliveries.length === 0) {
            warnings.push('Customer orders are not connected to Supabase yet, so this board will only show real local checkout records until setup is finished.');
        }
    } else {
        try {
            const orders = await fetchCustomerOrders();
            deliveries = mergeDeliveryCollections({
                remote: orders.map((record) => mapSupabaseOrder(record)),
                local: localDeliveries,
                history: localDeliveryHistory.length > 0 ? localDeliveryHistory : buildStoredDeliveryList(),
                activity: activityDeliveries,
            });

            if (orders.length === 0 && deliveries.length === 0) {
                warnings.push('No delivery orders were found yet.');
            }
        } catch {
            deliveries = mergeDeliveryCollections({
                local: localDeliveries,
                history: localDeliveryHistory.length > 0 ? localDeliveryHistory : buildStoredDeliveryList(),
                activity: activityDeliveries,
            });
            warnings.push('Customer orders could not be loaded right now.');
        }
    }

    const customers = buildCustomerDirectory(appointmentResult.appointments, deliveries, storedActivities);
    const riders = buildRiderDirectory(riderRoster, deliveries, appointmentResult.appointments, storedActivities);

    return {
        appointments: appointmentResult.appointments,
        appointmentWarnings: appointmentResult.warnings || [],
        deliveries,
        deliveryRiderOptions: getDeliveryRiderOptions(riderRoster, deliveries),
        customers,
        riders,
        warnings,
    };
}

export function saveDeliveryAssignment(deliveryKey, riderName) {
    const nextAssignments = {
        ...readDeliveryAssignmentStore(),
        [deliveryKey]: riderName,
    };

    writeDeliveryAssignmentStore(nextAssignments);

    if (deliveryKey.startsWith('delivery-local:')) {
        const orderId = deliveryKey.replace('delivery-local:', '');
        const riderRecord = riderName === 'Unassigned' ? null : findRiderRecordByName(riderName);

        updateStoredOrder(orderId, {
            status: riderName === 'Unassigned' ? 'Waiting rider assignment' : 'Rider assigned',
            assignedRider: riderName === 'Unassigned' ? '' : riderName,
            riderName: riderName === 'Unassigned' ? 'Waiting for rider' : riderName,
            riderVehicle: riderName === 'Unassigned' ? 'Waiting for vehicle' : riderRecord?.vehicle || 'Vehicle not set',
            riderCode: riderRecord?.code || '',
            riderZone: riderRecord?.zone || '',
        });
    }

    if (!deliveryKey.startsWith('delivery-local:') && isSupabaseConfigured && supabase) {
        const normalizedRiderName = riderName === 'Unassigned' ? '' : riderName;
        const riderRecord = normalizedRiderName ? findRiderRecordByName(normalizedRiderName) : null;
        const orderCode = deliveryKey.split(':')[1];

        if (orderCode) {
            supabase
                .from('customer_orders')
                .update({
                    status: normalizedRiderName ? 'Rider assigned' : 'Waiting rider assignment',
                    rider_name: normalizedRiderName,
                    rider_vehicle: normalizedRiderName ? riderRecord?.vehicle || 'Vehicle not set' : '',
                })
                .eq('order_code', orderCode);
        }
    }

    return nextAssignments;
}
