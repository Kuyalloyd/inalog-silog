import { useEffect, useMemo, useState } from 'react';
import LeafletOrderMap from '../../components/LeafletOrderMap';
import { formatCurrency, formatDateTime, getFirstName } from '../../lib/formatting';
import { DEFAULT_STORE_LOCATION, geocodeAddress, getCurrentPosition, hasCoordinates, interpolateLocation, normalizeCoordinates } from '../../lib/locationTracking';
import { clearActiveOrder, readActiveOrder, saveActiveOrder } from '../../lib/orderHistory';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

const DELIVERY_TRACKING_STEPS = [
    { title: 'Order received', detail: 'Kitchen accepted your order.' },
    { title: 'Preparing', detail: 'Meals are being packed for release.' },
    { title: 'On route', detail: 'Rider is moving toward your address.' },
    { title: 'Delivered', detail: 'Drop-off is complete.' },
];

const PICKUP_TRACKING_STEPS = [
    { title: 'Order received', detail: 'Kitchen accepted your pick-up request.' },
    { title: 'Preparing', detail: 'Meals are being packed at the counter.' },
    { title: 'Final handoff', detail: 'Release team is staging the order.' },
    { title: 'Ready to claim', detail: 'Your order is ready for pick-up.' },
];

function getRemainingSeconds(order) {
    if (!order?.createdAt || !order?.deliveryEstimateMinutes) {
        return 0;
    }

    const createdAt = new Date(order.createdAt).getTime();
    const targetTime = createdAt + order.deliveryEstimateMinutes * 60 * 1000;

    return Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
}

function formatCountdown(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getTrackingStage(remainingSeconds, order) {
    if (!order) {
        return {
            label: 'Walang active order',
            detail: 'Mag-place muna ng order para magkaroon ng live tracking card.',
            step: 0,
            tone: 'idle',
        };
    }

    const isDelivery = order.mode !== 'pickup';
    const normalizedStatus = String(order.status || '').toLowerCase();

    if (normalizedStatus.includes('deliver')) {
        return {
            label: 'Successfully delivered',
            detail: 'The rider already completed your delivery and your order is safely at your address.',
            step: 3,
            tone: 'done',
        };
    }

    if (normalizedStatus.includes('ready for pick-up')) {
        return {
            label: 'Ready for pick-up',
            detail: 'Your order is ready at the counter and waiting for you.',
            step: 3,
            tone: 'done',
        };
    }

    if (remainingSeconds <= 0) {
        return {
            label: isDelivery ? 'Delivered' : 'Ready for pick-up',
            detail: isDelivery ? 'Nasa iyo na ang order at tapos na ang biyahe ng rider.' : 'Handa na ang order mo sa counter at pwede mo na itong kunin.',
            step: 3,
            tone: 'done',
        };
    }

    if (remainingSeconds > 10 * 60) {
        return {
            label: 'Order received',
            detail: 'Natanggap na ng kusina ang order mo at inaayos na ito para sa next kitchen lane.',
            step: 0,
            tone: 'pending',
        };
    }

    if (remainingSeconds > 5 * 60) {
        return {
            label: 'Preparing',
            detail: isDelivery
                ? 'Nasa kitchen line na ang order mo at ipinapack na ito bago kunin ng rider.'
                : 'Nasa kitchen line na ang order mo at ipinapack na ito para sa counter release.',
            step: 1,
            tone: 'active',
        };
    }

    return {
        label: isDelivery ? 'Rider on the way' : 'Final handoff',
        detail: isDelivery ? 'Nasa biyahe na ang rider at papalapit na sa iyong address.' : 'Nasa final release lane na ang order at malapit nang maging ready for pick-up.',
        step: 2,
        tone: 'nearing',
    };
}

function toText(value, fallback = '') {
    if (typeof value !== 'string') {
        return fallback;
    }

    const normalizedValue = value.trim();

    return normalizedValue || fallback;
}

function mapRemoteTrackingOrder(record, currentOrder) {
    if (!record || !currentOrder) {
        return currentOrder;
    }

    const orderItems = Array.isArray(record?.order_items) ? record.order_items : currentOrder.items || [];
    const assignedRider = toText(record?.rider_name, currentOrder.assignedRider || '');
    const normalizedStatus = String(record?.status || currentOrder.status || '').toLowerCase();

    return {
        ...currentOrder,
        createdAt: record?.created_at || currentOrder.createdAt,
        updatedAt: record?.updated_at || currentOrder.updatedAt || '',
        claimedAt: record?.claimed_at || currentOrder.claimedAt || (assignedRider ? record?.updated_at || '' : ''),
        deliveredAt: record?.delivered_at || currentOrder.deliveredAt || (normalizedStatus.includes('deliver') ? record?.updated_at || '' : ''),
        mode: toText(record?.order_mode, currentOrder.mode || 'delivery'),
        status: toText(record?.status, currentOrder.status || 'Waiting rider assignment'),
        itemCount: Number(record?.item_count) || currentOrder.itemCount || orderItems.length,
        total: Number(record?.total_amount) || currentOrder.total || 0,
        eta: currentOrder.eta || `${Number(record?.delivery_estimate_minutes) || currentOrder.deliveryEstimateMinutes || 15} min`,
        deliveryEstimateMinutes: Number(record?.delivery_estimate_minutes) || currentOrder.deliveryEstimateMinutes || 15,
        customerName: toText(record?.customer_name, currentOrder.customerName || 'Customer order'),
        email: toText(record?.email, currentOrder.email || 'No email saved'),
        phone: toText(record?.phone, currentOrder.phone || 'No phone saved'),
        address: toText(record?.delivery_address || record?.address, currentOrder.address || 'No delivery address saved'),
        paymentMethod: toText(record?.payment_method, currentOrder.paymentMethod || 'Payment not set'),
        notes: toText(record?.notes, currentOrder.notes || ''),
        assignedRider,
        riderName: assignedRider || currentOrder.riderName || 'Waiting for rider',
        riderVehicle: toText(record?.rider_vehicle, currentOrder.riderVehicle || (assignedRider ? 'Vehicle not set' : 'Waiting for vehicle')),
        riderCode: toText(record?.rider_code, currentOrder.riderCode || ''),
        riderZone: toText(record?.rider_zone, currentOrder.riderZone || ''),
        items: orderItems.map((item) => ({
            name: item?.name || 'Order item',
            price: Number(item?.price) || 0,
            quantity: Number(item?.quantity) || 1,
        })),
    };
}

export default function OrderTrackingPage() {
    const initialOrder = readActiveOrder();
    const [activeOrder, setActiveOrder] = useState(initialOrder);
    const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingSeconds(initialOrder));
    const [customerLocation, setCustomerLocation] = useState(() => normalizeCoordinates(initialOrder?.customerLocation, initialOrder?.address || 'Customer location'));
    const [locationState, setLocationState] = useState(() => {
        if (!initialOrder) {
            return 'idle';
        }

        if (initialOrder.mode === 'pickup') {
            return 'pickup';
        }

        return hasCoordinates(initialOrder.customerLocation) ? 'ready' : 'loading';
    });

    useEffect(() => {
        const nextOrder = readActiveOrder();
        setActiveOrder(nextOrder);
        setRemainingSeconds(getRemainingSeconds(nextOrder));

        const intervalId = window.setInterval(() => {
            const currentOrder = readActiveOrder();
            setActiveOrder(currentOrder);

            const nextRemainingSeconds = getRemainingSeconds(currentOrder);
            setRemainingSeconds(nextRemainingSeconds);

            const completedStatus = currentOrder?.mode === 'pickup' ? 'Ready for pick-up' : 'Na-deliver na';

            if (currentOrder && nextRemainingSeconds <= 0 && currentOrder.status !== completedStatus) {
                const deliveredOrder = {
                    ...currentOrder,
                    status: completedStatus,
                };

                saveActiveOrder(deliveredOrder);
                setActiveOrder(deliveredOrder);
            }
        }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        if (!activeOrder?.id || !isSupabaseConfigured || !supabase) {
            return undefined;
        }

        let isMounted = true;

        async function refreshRemoteOrder() {
            const { data, error } = await supabase.from('customer_orders').select('*').eq('order_code', activeOrder.id).maybeSingle();

            if (error || !data || !isMounted) {
                return;
            }

            const nextOrder = mapRemoteTrackingOrder(data, readActiveOrder() || activeOrder);
            saveActiveOrder(nextOrder);

            if (isMounted) {
                setActiveOrder(nextOrder);
            }
        }

        const ordersChannel = supabase
            .channel(`tracking-order-${activeOrder.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'customer_orders',
                },
                (payload) => {
                    const changedCode = payload?.new?.order_code || payload?.old?.order_code || '';

                    if (changedCode === activeOrder.id) {
                        refreshRemoteOrder();
                    }
                },
            )
            .subscribe();
        const intervalId = window.setInterval(refreshRemoteOrder, 4000);

        refreshRemoteOrder();

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
            supabase.removeChannel(ordersChannel);
        };
    }, [activeOrder?.id]);

    useEffect(() => {
        const normalizedLocation = normalizeCoordinates(activeOrder?.customerLocation, activeOrder?.address || 'Customer location');

        if (normalizedLocation) {
            setCustomerLocation(normalizedLocation);
            setLocationState('ready');
            return undefined;
        }

        if (!activeOrder) {
            setCustomerLocation(null);
            setLocationState('idle');
            return undefined;
        }

        if (activeOrder.mode === 'pickup') {
            setCustomerLocation(null);
            setLocationState('pickup');
            return undefined;
        }

        let isCurrent = true;
        const controller = new AbortController();

        async function resolveLocation() {
            setLocationState('loading');

            const liveLocation = await getCurrentPosition();

            if (!isCurrent) {
                return;
            }

            if (liveLocation) {
                const nextOrder = {
                    ...activeOrder,
                    customerLocation: liveLocation,
                };

                saveActiveOrder(nextOrder);
                setActiveOrder(nextOrder);
                setCustomerLocation(liveLocation);
                setLocationState('ready');
                return;
            }

            try {
                const geocodedLocation = await geocodeAddress(activeOrder.address, controller.signal);

                if (!isCurrent) {
                    return;
                }

                if (geocodedLocation) {
                    const nextOrder = {
                        ...activeOrder,
                        customerLocation: geocodedLocation,
                    };

                    saveActiveOrder(nextOrder);
                    setActiveOrder(nextOrder);
                    setCustomerLocation(geocodedLocation);
                    setLocationState('ready');
                    return;
                }
            } catch {
                // Fallback state is handled below.
            }

            if (isCurrent) {
                setCustomerLocation(null);
                setLocationState('fallback');
            }
        }

        resolveLocation();

        return () => {
            isCurrent = false;
            controller.abort();
        };
    }, [activeOrder?.address, activeOrder?.customerLocation, activeOrder?.id, activeOrder?.mode]);

    const trackingStage = useMemo(() => getTrackingStage(remainingSeconds, activeOrder), [remainingSeconds, activeOrder]);
    const isDelivered = String(activeOrder?.status || '').toLowerCase().includes('deliver');
    const trackingProgress = activeOrder
        ? isDelivered
            ? 100
            : Math.min(100, Math.max(0, ((activeOrder.deliveryEstimateMinutes * 60 - remainingSeconds) / (activeOrder.deliveryEstimateMinutes * 60)) * 100))
        : 0;

    if (!activeOrder) {
        return (
            <section className="page-section">
                <div className="checkout-empty">
                    <div className="checkout-empty__card">
                        <p className="eyebrow">Order tracking</p>
                        <h1 className="section-heading__title">Wala pang active order na pwedeng i-track.</h1>
                        <p className="section-heading__text">
                            Pagkatapos mong mag-checkout, dito lalabas ang confirmation, 15-minute ETA, at map-style delivery tracker.
                        </p>
                        <div className="page-hero__actions">
                            <a className="button-link" href="/menu">
                                Umorder ngayon
                            </a>
                            <a className="button-link--ghost" href="/dashboard">
                                Aking dashboard
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const isDelivery = activeOrder.mode !== 'pickup';
    const customerFirstName = getFirstName(activeOrder.customerName || 'Kaibigan');
    const trackingSteps = isDelivery ? DELIVERY_TRACKING_STEPS : PICKUP_TRACKING_STEPS;
    const progressLabel = isDelivered ? 'Delivered' : remainingSeconds > 0 ? formatCountdown(remainingSeconds) : isDelivery ? 'Delivered' : 'Ready';
    const destinationLabel = isDelivery ? 'Delivery address' : 'Pick-up counter';
    const destinationValue = isDelivery ? activeOrder.address : activeOrder.storeName;
    const middleStopLabel = isDelivery ? 'Dispatch' : 'Packing';
    const middleStopValue = isDelivery ? activeOrder.riderName : 'Release team';
    const routeModeLabel = isDelivery ? 'Delivery route' : 'Pick-up flow';
    const serviceCarrierLabel = isDelivery ? activeOrder.riderVehicle : 'Counter release';
    const storeLocation = normalizeCoordinates(activeOrder.storeLocation, activeOrder.storeName) || {
        ...DEFAULT_STORE_LOCATION,
        label: activeOrder.storeName,
    };
    const riderLocation = useMemo(
        () => (isDelivery && customerLocation ? (isDelivered ? customerLocation : interpolateLocation(storeLocation, customerLocation, trackingProgress / 100)) : null),
        [customerLocation, isDelivered, isDelivery, storeLocation, trackingProgress],
    );
    const locationHelperText =
        locationState === 'loading'
            ? 'Getting the customer location for the real map...'
            : locationState === 'fallback'
              ? 'The saved delivery address could not be matched to the map yet. Check the customer address details and try again.'
              : customerLocation?.source === 'device'
                ? 'Map is using the customer device location.'
                : customerLocation?.source === 'address'
                  ? 'Map is using the saved delivery address.'
                  : customerLocation?.source === 'local-hint'
                    ? 'Map is using the saved customer area in Butuan so the rider still has a route to follow.'
                  : 'Map is ready.';

    return (
        <section className="page-section">
            <div className="tracking-shell">
                {isDelivered ? (
                    <div className="note-strip note-strip--soft">
                        <strong>Successfully delivered</strong>
                        <span>
                            Enjoy your meal, {customerFirstName}. {activeOrder.riderName || 'Your rider'} completed this order
                            {activeOrder.deliveredAt ? ` on ${formatDateTime(activeOrder.deliveredAt)}` : ''}.
                        </span>
                    </div>
                ) : null}

                <section className="tracking-hero tracking-hero--refined">
                    <div className="tracking-hero__copy">
                        <div className="tracking-hero__eyebrow-row">
                            <p className="tracking-card__kicker">Live order board</p>
                            <span className={`tracking-status-pill tracking-status-pill--${trackingStage.tone}`}>{trackingStage.label}</span>
                        </div>
                        <h1 className="tracking-hero__title">{isDelivered ? 'Your order has arrived.' : 'Your order is moving.'}</h1>
                        <p className="tracking-hero__text">{trackingStage.detail}</p>

                        <div className="tracking-hero__chips">
                            <span>{activeOrder.id}</span>
                            <span>{isDelivery ? 'Delivery' : 'Pick-up'}</span>
                            <span>{activeOrder.paymentMethod}</span>
                        </div>

                        <div className="tracking-hero__stats">
                            <div className="tracking-hero__stat">
                                <strong>{activeOrder.id}</strong>
                                <span>Order code</span>
                            </div>
                            <div className="tracking-hero__stat">
                                <strong>{progressLabel}</strong>
                                <span>{isDelivery ? 'ETA' : 'Ready timer'}</span>
                            </div>
                            <div className="tracking-hero__stat">
                                <strong>{activeOrder.riderName}</strong>
                                <span>{isDelivery ? 'Assigned rider' : 'Release team'}</span>
                            </div>
                            <div className="tracking-hero__stat">
                                <strong>{formatCurrency(activeOrder.total)}</strong>
                                <span>Total paid lane</span>
                            </div>
                        </div>
                    </div>

                    <div className="tracking-hero__card tracking-hero__card--board">
                        <div className="tracking-hero__card-head">
                            <div>
                                <p className="tracking-hero__kicker">Route overview</p>
                                <strong>{Math.round(trackingProgress)}% complete</strong>
                            </div>
                            <span className="tracking-hero__eta-badge">{progressLabel}</span>
                        </div>
                        <p className="tracking-hero__card-text">
                            {isDelivery
                                ? 'The rider is now moving across the active route lane toward your saved delivery address.'
                                : 'The order is moving through the store release flow so it can be ready for your arrival.'}
                        </p>
                        <div className="tracking-hero__progress">
                            <div className="tracking-hero__progress-bar" style={{ width: `${trackingProgress}%` }} />
                        </div>
                        <div className="tracking-hero__route-metrics">
                            <div>
                                <span>From</span>
                                <strong>{activeOrder.storeName}</strong>
                            </div>
                            <div>
                                <span>Carrier</span>
                                <strong>{activeOrder.riderName}</strong>
                            </div>
                            <div>
                                <span>Destination</span>
                                <strong>{destinationValue}</strong>
                            </div>
                        </div>
                        <div className="tracking-hero__actions">
                            <a className="button-link" href="/dashboard/orders">
                                Open orders
                            </a>
                            <button
                                className="button-link--ghost"
                                type="button"
                                onClick={() => {
                                    clearActiveOrder();
                                    setActiveOrder(null);
                                }}
                            >
                                Clear tracker
                            </button>
                        </div>
                    </div>
                </section>

                <div className="tracking-grid">
                    <section className="tracking-map-card tracking-map-card--customer">
                        <div className="tracking-card__head">
                            <div>
                                <p className="tracking-card__kicker">{routeModeLabel}</p>
                                <h2>{isDelivery ? 'Live customer map' : 'Pick-up release view'}</h2>
                            </div>
                            <span>{activeOrder.eta}</span>
                        </div>

                        {isDelivery ? (
                            <div className="tracking-map tracking-map--leaflet-card">
                                {customerLocation ? (
                                    <LeafletOrderMap
                                        className="tracking-map__leaflet"
                                        storeLocation={storeLocation}
                                        customerLocation={customerLocation}
                                        riderLocation={riderLocation}
                                        riderLabel={[activeOrder.riderName, activeOrder.riderVehicle].filter(Boolean).join(' | ')}
                                        riderMarkerLabel={activeOrder.riderVehicle || 'Rider'}
                                        destinationLabel={destinationValue}
                                        storeLabel={activeOrder.storeName}
                                    />
                                ) : (
                                    <div className="tracking-map__loading">
                                        <strong>Preparing real map...</strong>
                                        <p>{locationHelperText}</p>
                                    </div>
                                )}

                                <div className="tracking-map__caption">
                                    <strong>Customer map status</strong>
                                    <p>{locationHelperText}</p>
                                </div>

                                <div className="tracking-map__legend">
                                    <div>
                                        <span>From</span>
                                        <strong>{activeOrder.storeName}</strong>
                                    </div>
                                    <div>
                                        <span>Current</span>
                                        <strong>{activeOrder.riderName}</strong>
                                    </div>
                                    <div>
                                        <span>{destinationLabel}</span>
                                        <strong>{destinationValue}</strong>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="tracking-map tracking-map--pickup-board">
                                <div className="tracking-map__pickup-card">
                                    <span>Store</span>
                                    <strong>{activeOrder.storeName}</strong>
                                </div>
                                <div className="tracking-map__pickup-card tracking-map__pickup-card--accent">
                                    <span>{middleStopLabel}</span>
                                    <strong>{middleStopValue}</strong>
                                </div>
                                <div className="tracking-map__pickup-card">
                                    <span>{destinationLabel}</span>
                                    <strong>{destinationValue}</strong>
                                </div>
                                <p className="tracking-map__pickup-copy">
                                    Pick-up orders stay inside the store release flow, so the board highlights the kitchen, packing, and counter handoff instead of a rider map.
                                </p>
                            </div>
                        )}

                        <div className="tracking-steps">
                            {trackingSteps.map((step, index) => (
                                <div
                                    className={index <= trackingStage.step ? 'tracking-step tracking-step--active' : 'tracking-step'}
                                    key={step.title}
                                >
                                    <span>{index + 1}</span>
                                    <strong>{step.title}</strong>
                                    <p>{step.detail}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <aside className="tracking-sidebar">
                        <section className="tracking-info-card tracking-info-card--accent">
                            <div className="tracking-card__head">
                                <div>
                                    <p className="tracking-card__kicker">Rider and order</p>
                                    <h2>{isDelivery ? 'Delivery details' : 'Pick-up details'}</h2>
                                </div>
                            </div>

                            <div className="tracking-info-list">
                                <div>
                                    <span>{isDelivery ? 'Rider' : 'Release team'}</span>
                                    <strong>{activeOrder.riderName}</strong>
                                </div>
                                <div>
                                    <span>{isDelivery ? 'Vehicle' : 'Service lane'}</span>
                                    <strong>{serviceCarrierLabel}</strong>
                                </div>
                                <div>
                                    <span>Order placed</span>
                                    <strong>{formatDateTime(activeOrder.createdAt)}</strong>
                                </div>
                                <div>
                                    <span>Payment</span>
                                    <strong>{activeOrder.paymentMethod}</strong>
                                </div>
                                <div>
                                    <span>{destinationLabel}</span>
                                    <strong>{destinationValue}</strong>
                                </div>
                                <div>
                                    <span>Status board</span>
                                    <strong>{trackingStage.label}</strong>
                                </div>
                                <div>
                                    <span>Delivered at</span>
                                    <strong>{activeOrder.deliveredAt ? formatDateTime(activeOrder.deliveredAt) : 'Waiting for delivery completion'}</strong>
                                </div>
                            </div>
                        </section>

                        <section className="tracking-info-card">
                            <div className="tracking-card__head">
                                <div>
                                    <p className="tracking-card__kicker">Order summary</p>
                                    <h2>{formatCurrency(activeOrder.total)}</h2>
                                </div>
                            </div>

                            <div className="tracking-order-list">
                                {activeOrder.items.map((item) => (
                                    <div className="tracking-order-row" key={item.name}>
                                        <span>
                                            {item.quantity} x {item.name}
                                        </span>
                                        <strong>{formatCurrency(item.price * item.quantity)}</strong>
                                    </div>
                                ))}
                            </div>

                            <div className="tracking-sidebar__note">
                                <span>Kitchen or rider note</span>
                                <strong>{activeOrder.notes || 'No extra notes were attached to this order.'}</strong>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </section>
    );
}
