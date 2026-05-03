import { useEffect, useState } from 'react';
import { assignDeliveryOrder, normalizeOrderMode, readActiveOrder, readDeliveryOrders, saveActiveOrder, updateStoredOrder } from '../lib/orderHistory';
import { logAdminActivity } from '../lib/adminActivityLog';
import { readRiderSession, saveRiderSessionFromMember } from '../lib/riderSession';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

function toText(value, fallback = '') {
    if (typeof value !== 'string') {
        return fallback;
    }

    const normalizedValue = value.trim();

    return normalizedValue || fallback;
}

function extractMissingColumnName(error) {
    const errorText = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ');
    const missingColumnMatch =
        errorText.match(/Could not find the '([^']+)' column/i) ||
        errorText.match(/column ['"]?([^'"\s]+)['"]?/i);

    return missingColumnMatch?.[1] || '';
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

function isSameRiderName(left, right) {
    return toText(left, '').toLowerCase() === toText(right, '').toLowerCase();
}

function isClosedDeliveryStatus(status) {
    const normalizedStatus = String(status || '').toLowerCase();

    return (
        normalizedStatus.includes('deliver') ||
        normalizedStatus.includes('ready for pick-up') ||
        normalizedStatus.includes('cancel') ||
        normalizedStatus.includes('completed')
    );
}

function getRemoteOrderId(record) {
    return toText(
        record?.order_code || record?.reference_code || (record?.id ? `IS-${String(record.id).slice(-6)}` : ''),
        '',
    );
}

function mapRemoteOrder(record) {
    const orderItems = Array.isArray(record?.order_items) ? record.order_items : [];
    const orderId = getRemoteOrderId(record);
    const mode = normalizeOrderMode(record?.order_mode || record?.mode);
    const assignedRider = normalizeAssignedRider(record?.rider_name || record?.assignedRider);

    if (!orderId) {
        return null;
    }

    return {
        id: orderId,
        createdAt: record?.created_at || new Date().toISOString(),
        updatedAt: record?.updated_at || '',
        claimedAt: record?.claimed_at || (assignedRider ? record?.updated_at || '' : ''),
        deliveredAt: record?.delivered_at || (String(record?.status || '').toLowerCase().includes('deliver') ? record?.updated_at || '' : ''),
        mode,
        status: toText(record?.status, mode === 'delivery' ? 'Waiting rider assignment' : 'Preparing order'),
        itemCount: Number(record?.item_count) || orderItems.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0),
        total: Number(record?.total_amount) || Number(record?.total) || 0,
        eta: `${Number(record?.delivery_estimate_minutes) || 15} min`,
        deliveryEstimateMinutes: Number(record?.delivery_estimate_minutes) || 15,
        customerName: toText(record?.customer_name, 'Customer delivery'),
        email: toText(record?.email, 'No email saved'),
        phone: toText(record?.phone, 'No phone saved'),
        address: toText(record?.delivery_address || record?.address, 'No delivery address saved'),
        paymentMethod: toText(record?.payment_method, 'Payment not set'),
        notes: toText(record?.notes, ''),
        assignedRider,
        riderName: assignedRider || 'Waiting for rider',
        riderVehicle: toText(record?.rider_vehicle, assignedRider ? 'Vehicle not set' : 'Waiting for vehicle'),
        storeName: 'Inalog Silog Butuan',
        items: orderItems.map((item) => ({
            name: item?.name || 'Order item',
            price: Number(item?.price) || 0,
            quantity: Number(item?.quantity) || 1,
        })),
    };
}

async function fetchSupabaseDeliveryOrders() {
    if (!isSupabaseConfigured || !supabase) {
        return [];
    }

    const { data, error } = await supabase.from('customer_orders').select('*').order('created_at', { ascending: false }).limit(50);

    if (error) {
        throw error;
    }

    return (Array.isArray(data) ? data : []).map((record) => mapRemoteOrder(record)).filter(Boolean);
}

async function syncSupabaseDeliveryOrder(orderId, changes) {
    if (!orderId || !isSupabaseConfigured || !supabase) {
        return;
    }

    const nextChanges = { ...changes };

    while (Object.keys(nextChanges).length > 0) {
        const { error } = await supabase.from('customer_orders').update(nextChanges).eq('order_code', orderId);

        if (!error) {
            return;
        }

        const missingColumnName = extractMissingColumnName(error);

        if (!missingColumnName || !(missingColumnName in nextChanges)) {
            throw error;
        }

        delete nextChanges[missingColumnName];
    }
}

function mergeDeliveryOrders(localOrders, remoteOrders) {
    const orderMap = new Map();

    [...remoteOrders, ...localOrders].forEach((order) => {
        if (!order?.id) {
            return;
        }

        orderMap.set(order.id, order);
    });

    return Array.from(orderMap.values());
}

function getRouteProgress(order) {
    if (!order?.createdAt || !order?.deliveryEstimateMinutes) {
        return 58;
    }

    const createdAt = new Date(order.createdAt).getTime();
    const totalMs = order.deliveryEstimateMinutes * 60 * 1000;
    const elapsedMs = Date.now() - createdAt;

    if (Number.isNaN(createdAt) || totalMs <= 0) {
        return 58;
    }

    return Math.min(94, Math.max(12, (elapsedMs / totalMs) * 100));
}

function sortOrdersByAge(orders) {
    return [...orders].sort((left, right) => new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime());
}

function buildStandbyDrop(openOrderCount) {
    return {
        code: openOrderCount > 0 ? `${openOrderCount} open` : 'Standby',
        customer: openOrderCount > 0 ? 'Checkout orders waiting' : 'No delivery assigned',
        address: openOrderCount > 0 ? 'Claim a checkout order from the queue below.' : 'Waiting for new checkout orders.',
        landmark: 'Use the queue page to view customer delivery details.',
        eta: '--',
        status: openOrderCount > 0 ? 'Open checkout' : 'Standby',
        tone: openOrderCount > 0 ? 'gold' : 'ink',
        payment: 'No payment yet',
        total: 0,
        riderName: 'Waiting for rider',
        riderVehicle: 'Waiting for vehicle',
        storeName: 'Inalog Silog Butuan',
    };
}

function buildDeliveryCard(order, riderSession, statusOverride, toneOverride) {
    const assignedRider = order.assignedRider || '';

    return {
        code: order.id,
        customer: order.customerName || 'Customer delivery',
        address: order.address || 'Waiting for saved delivery address',
        landmark: order.notes || 'Check customer landmark or rider notes',
        eta: order.eta || `${order.deliveryEstimateMinutes || 15} min`,
        status: statusOverride || order.status || (assignedRider ? 'Rider assigned' : 'Open checkout'),
        tone: toneOverride || (assignedRider ? 'green' : 'gold'),
        payment: order.paymentMethod || 'Payment not set',
        total: Number(order.total) || 0,
        riderName: assignedRider || 'Waiting for rider',
        riderVehicle: riderSession?.vehicle || order.riderVehicle || 'Waiting for vehicle',
        storeName: order.storeName || 'Inalog Silog Butuan',
        rawOrder: order,
    };
}

export default function useRiderPanelData() {
    const [activeOrderSnapshot, setActiveOrderSnapshot] = useState(() => readActiveOrder());
    const [deliveryOrders, setDeliveryOrders] = useState(() => readDeliveryOrders());
    const [remoteDeliveryOrders, setRemoteDeliveryOrders] = useState([]);
    const [riderSession, setRiderSession] = useState(() => readRiderSession());

    useEffect(() => {
        let isMounted = true;

        async function refreshPanelData() {
            const savedSession = readRiderSession();

            if (!isMounted) {
                return;
            }

            setActiveOrderSnapshot(readActiveOrder());
            setDeliveryOrders(readDeliveryOrders());
            setRiderSession(savedSession);

            if (!savedSession && isSupabaseConfigured && supabase) {
                const { data } = await supabase.auth.getSession();
                const riderUser = data.session?.user;

                if (isMounted && riderUser?.user_metadata?.role === 'rider') {
                    const syncedSession = saveRiderSessionFromMember(riderUser);

                    if (syncedSession) {
                        setRiderSession(syncedSession);
                    }
                }
            }

            if (!isSupabaseConfigured || !supabase) {
                setRemoteDeliveryOrders([]);
                return;
            }

            try {
                const nextRemoteOrders = await fetchSupabaseDeliveryOrders();

                if (isMounted) {
                    setRemoteDeliveryOrders(nextRemoteOrders);
                }
            } catch {
                if (isMounted) {
                    setRemoteDeliveryOrders([]);
                }
            }
        }

        function handleVisibilityChange() {
            if (document.visibilityState === 'visible') {
                refreshPanelData();
            }
        }

        refreshPanelData();

        const intervalId = window.setInterval(refreshPanelData, 2500);
        const ordersChannel =
            isSupabaseConfigured && supabase
                ? supabase
                      .channel('rider-customer-orders')
                      .on(
                          'postgres_changes',
                          {
                              event: '*',
                              schema: 'public',
                              table: 'customer_orders',
                          },
                          () => {
                              refreshPanelData();
                          },
                      )
                      .subscribe()
                : null;

        window.addEventListener('storage', refreshPanelData);
        window.addEventListener('focus', refreshPanelData);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
            window.removeEventListener('storage', refreshPanelData);
            window.removeEventListener('focus', refreshPanelData);
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            if (ordersChannel && supabase) {
                supabase.removeChannel(ordersChannel);
            }
        };
    }, []);

    const riderName = riderSession?.riderName || 'Rider';
    const riderVehicle = riderSession?.vehicle || 'Vehicle not set';
    const riderCode = riderSession?.riderCode || 'No code';
    const riderZone = riderSession?.zone || 'No zone';
    const mergedDeliveryOrders = mergeDeliveryOrders(deliveryOrders, remoteDeliveryOrders);
    const assignedOrders = riderSession?.riderName
        ? sortOrdersByAge(
              mergedDeliveryOrders.filter(
                  (order) =>
                      normalizeOrderMode(order.mode) === 'delivery' &&
                      isSameRiderName(order.assignedRider, riderSession.riderName) &&
                      !isClosedDeliveryStatus(order.status),
              ),
          )
        : [];
    const openOrders = sortOrdersByAge(
        mergedDeliveryOrders.filter(
            (order) =>
                normalizeOrderMode(order.mode) === 'delivery' &&
                !normalizeAssignedRider(order.assignedRider) &&
                !isClosedDeliveryStatus(order.status),
        ),
    );
    const activeOrder = assignedOrders[0] || null;
    const isLiveDelivery = Boolean(activeOrder?.id);
    const routeProgress = getRouteProgress(activeOrder || activeOrderSnapshot);
    const queue = assignedOrders.map((order, index) => buildDeliveryCard(order, riderSession, index === 0 ? 'Current stop' : 'Queued', index === 0 ? 'green' : 'ink'));
    const availableOrders = openOrders.map((order) => buildDeliveryCard(order, riderSession, 'Open checkout', 'gold'));
    const activeDrop = queue[0] || buildStandbyDrop(availableOrders.length);
    const riderStats = [
        { value: riderCode, label: 'Rider code' },
        { value: `${queue.length}`, label: 'Assigned stops' },
        { value: `${availableOrders.length}`, label: 'Open checkout' },
    ];

    function refresh() {
        setActiveOrderSnapshot(readActiveOrder());
        setDeliveryOrders(readDeliveryOrders());
        setRiderSession(readRiderSession());
    }

    async function claimOrder(orderId) {
        const latestSession = readRiderSession();
        let updatedOrder = assignDeliveryOrder(orderId, latestSession);

        if (!updatedOrder) {
            const remoteOrder = mergedDeliveryOrders.find((order) => order.id === orderId);

            if (remoteOrder) {
                saveActiveOrder(remoteOrder);
                updatedOrder = assignDeliveryOrder(orderId, latestSession);
            }
        }

        if (updatedOrder && latestSession?.riderName) {
            const claimedAt = updatedOrder.claimedAt || new Date().toISOString();

            try {
                await syncSupabaseDeliveryOrder(orderId, {
                    status: 'Rider assigned',
                    rider_name: latestSession.riderName,
                    rider_vehicle: latestSession.vehicle || '',
                    rider_code: latestSession.riderCode || '',
                    rider_zone: latestSession.zone || '',
                    claimed_at: claimedAt,
                });
            } catch {
                // Keep the rider queue usable locally even if the remote sync misses once.
            }

            logAdminActivity({
                type: 'Rider',
                title: 'Rider claimed delivery order',
                detail: `${updatedOrder.id} | ${updatedOrder.customerName} | ${updatedOrder.address} | ${updatedOrder.paymentMethod}`,
                actor: latestSession.riderName,
                tone: 'green',
                occurredAt: claimedAt,
            });
        }

        refresh();

        return updatedOrder;
    }

    async function completeCurrentOrder(orderId = activeOrder?.id) {
        if (!orderId) {
            return null;
        }

        const updatedOrder = updateStoredOrder(
            orderId,
            {
                status: 'Na-deliver na',
                deliveredAt: new Date().toISOString(),
            },
            { setAsActive: true },
        );

        if (updatedOrder) {
            try {
                await syncSupabaseDeliveryOrder(orderId, {
                    status: 'Na-deliver na',
                    delivered_at: updatedOrder.deliveredAt || new Date().toISOString(),
                });
            } catch {
                // Leave the local rider flow intact if the remote update is delayed.
            }

            logAdminActivity({
                type: 'Rider',
                title: 'Rider completed delivery',
                detail: `${updatedOrder.id} | ${updatedOrder.customerName} | ${updatedOrder.address}`,
                actor: riderSession?.riderName || updatedOrder.riderName || 'Rider',
                tone: 'green',
                occurredAt: updatedOrder.deliveredAt || new Date().toISOString(),
            });
        }

        refresh();

        return updatedOrder;
    }

    return {
        activeOrder: activeOrder || activeOrderSnapshot,
        riderSession,
        isLiveDelivery,
        routeProgress,
        queue,
        availableOrders,
        activeDrop,
        riderName,
        riderVehicle,
        riderCode,
        riderZone,
        riderStats,
        claimOrder,
        completeCurrentOrder,
    };
}
