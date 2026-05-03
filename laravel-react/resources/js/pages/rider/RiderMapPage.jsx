import { useEffect, useState } from 'react';
import LeafletOrderMap from '../../components/LeafletOrderMap';
import useRiderPanelData from '../../hooks/useRiderPanelData';
import { DEFAULT_STORE_LOCATION, getCurrentPosition, interpolateLocation, normalizeCoordinates } from '../../lib/locationTracking';

export default function RiderMapPage() {
    const { riderSession, activeOrder, routeProgress, queue, activeDrop, availableOrders, riderStats, isLiveDelivery } = useRiderPanelData();
    const [liveRiderLocation, setLiveRiderLocation] = useState(null);

    useEffect(() => {
        if (!riderSession || !isLiveDelivery) {
            setLiveRiderLocation(null);
            return undefined;
        }

        let isMounted = true;

        async function refreshRiderLocation() {
            const nextLocation = await getCurrentPosition({
                label: `${riderSession.riderName} live location`,
                enableHighAccuracy: true,
                maximumAge: 20000,
                timeout: 8000,
            });

            if (isMounted && nextLocation) {
                setLiveRiderLocation(nextLocation);
            }
        }

        function handleVisibilityChange() {
            if (document.visibilityState === 'visible') {
                refreshRiderLocation();
            }
        }

        refreshRiderLocation();

        const intervalId = window.setInterval(refreshRiderLocation, 15000);
        window.addEventListener('focus', refreshRiderLocation);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
            window.removeEventListener('focus', refreshRiderLocation);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isLiveDelivery, riderSession]);

    if (!riderSession) {
        return (
            <section className="page-section">
                <div className="panel-card dashboard-guest">
                    <p className="eyebrow">Route map</p>
                    <h1 className="panel-card__title">Open rider dispatch first.</h1>
                    <p className="form-card__text">The live map opens after rider sign-in.</p>
                    <div className="page-hero__actions">
                        <a className="button-link" href="/rider">
                            Open rider panel
                        </a>
                    </div>
                </div>
            </section>
        );
    }

    const customerLocation = normalizeCoordinates(activeOrder?.customerLocation, activeDrop.address);
    const storeLocation = normalizeCoordinates(activeOrder?.storeLocation, activeDrop.storeName) || {
        ...DEFAULT_STORE_LOCATION,
        label: activeDrop.storeName || DEFAULT_STORE_LOCATION.label,
    };
    const riderLocation =
        liveRiderLocation || (isLiveDelivery && customerLocation ? interpolateLocation(storeLocation, customerLocation, routeProgress / 100) : null);
    const riderPopupLabel = [riderSession.riderName, riderSession.vehicle || 'Vehicle not set', riderSession.riderCode || 'No code'].filter(Boolean).join(' | ');
    const riderMapLabel = riderSession.vehicle || 'Rider';
    const isCompletedDelivery = String(activeOrder?.status || '').toLowerCase().includes('deliver');
    const routeReady = customerLocation && (isLiveDelivery || isCompletedDelivery);

    return (
        <section className="page-section">
            <div className="rider-map-board">
                {isCompletedDelivery ? (
                    <div className="note-strip note-strip--soft rider-note-strip">
                        <strong>Successful delivery</strong>
                        <span>{riderSession.riderName} already completed this order. The customer route is now marked as delivered.</span>
                    </div>
                ) : null}

                {availableOrders.length > 0 && !isLiveDelivery ? (
                    <div className="note-strip note-strip--soft rider-note-strip">
                        <strong>{availableOrders.length} order(s) waiting in dispatch</strong>
                        <span>Open the rider orders page and claim a customer delivery first so the live route map can start.</span>
                    </div>
                ) : null}

                <section className="rider-map-board__hero">
                    <div>
                        <p className="rider-dispatch__eyebrow">Route map</p>
                        <h1>Live delivery lane.</h1>
                        <p>Store, {riderSession.vehicle || 'rider'}, and customer pins in one map.</p>

                        <div className="rider-map-board__actions">
                            <a className="button-link" href="/rider/queue">
                                Orders
                            </a>
                            <a className="button-link--ghost" href="/rider">
                                Dispatch
                            </a>
                        </div>
                    </div>

                    <div className="rider-map-board__stats">
                        {riderStats.map((stat) => (
                            <div key={stat.label}>
                                <strong>{stat.value}</strong>
                                <span>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="rider-map-board__grid">
                    <section className="tracking-map-card rider-map-board__card">
                        <div className="tracking-card__head">
                            <div>
                                <p className="tracking-card__kicker">Real route</p>
                                <h2>{isCompletedDelivery ? 'Delivered route summary' : isLiveDelivery ? 'Customer destination map' : 'Waiting for live delivery'}</h2>
                            </div>
                            <span>{queue.length} stop(s)</span>
                        </div>

                        {routeReady ? (
                            <div className="tracking-map tracking-map--leaflet-card">
                                <LeafletOrderMap
                                    className="tracking-map__leaflet"
                                    storeLocation={storeLocation}
                                    customerLocation={customerLocation}
                                    riderLocation={riderLocation}
                                    riderLabel={riderPopupLabel}
                                    riderMarkerLabel={riderMapLabel}
                                    destinationLabel={activeDrop.address}
                                    storeLabel={activeDrop.storeName || 'Inalog Silog Butuan'}
                                />

                                <div className="tracking-map__legend">
                                    <div>
                                        <span>Store</span>
                                        <strong>{activeDrop.storeName || 'Inalog Silog Butuan'}</strong>
                                    </div>
                                    <div>
                                        <span>Rider</span>
                                        <strong>{riderSession.riderName} | {riderSession.vehicle || 'Vehicle not set'}</strong>
                                    </div>
                                    <div>
                                        <span>Customer</span>
                                        <strong>{activeDrop.address}</strong>
                                    </div>
                                </div>

                                <div className="tracking-map__caption">
                                    <strong>{isCompletedDelivery ? 'Delivery completed successfully.' : liveRiderLocation ? 'Live rider location is on.' : 'Route preview is on.'}</strong>
                                    <p>
                                        {isCompletedDelivery
                                            ? `The route is now closed and saved as delivered for ${activeOrder?.customerName || 'the customer'}.`
                                            : liveRiderLocation
                                            ? `${riderSession.riderName} is sharing the current ${riderSession.vehicle || 'vehicle'} position from this device.`
                                            : `The map is following the delivery path for ${riderSession.riderName} and showing the registered ${riderSession.vehicle || 'vehicle'}.`}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="rider-map-board__fallback">
                                <strong>{availableOrders.length > 0 ? 'Claim an order first.' : 'No live route yet.'}</strong>
                                <p>{availableOrders.length > 0 ? 'Open the orders page and get a checkout order to start the rider map.' : 'Waiting for an active delivery order.'}</p>
                            </div>
                        )}
                    </section>

                    <aside className="rider-map-board__side">
                        <section className="rider-dispatch__card">
                            <div className="rider-dispatch__card-head">
                                <div>
                                    <p>Next stop</p>
                                    <h2>{activeDrop.customer}</h2>
                                </div>
                            </div>
                            <div className="rider-dispatch__status-list">
                                <div>
                                    <span>Address</span>
                                    <strong>{activeDrop.address}</strong>
                                </div>
                                <div>
                                    <span>Landmark</span>
                                    <strong>{activeDrop.landmark}</strong>
                                </div>
                                <div>
                                    <span>Status</span>
                                    <strong>{activeDrop.status}</strong>
                                </div>
                                <div>
                                    <span>ETA</span>
                                    <strong>{activeDrop.eta}</strong>
                                </div>
                            </div>
                        </section>

                        <section className="rider-dispatch__card">
                            <div className="rider-dispatch__card-head">
                                <div>
                                    <p>Rider profile</p>
                                    <h2>{riderSession.riderName}</h2>
                                </div>
                            </div>
                            <div className="rider-dispatch__status-list">
                                <div>
                                    <span>Vehicle</span>
                                    <strong>{riderSession.vehicle || 'Vehicle not set'}</strong>
                                </div>
                                <div>
                                    <span>Rider code</span>
                                    <strong>{riderSession.riderCode || 'No code'}</strong>
                                </div>
                                <div>
                                    <span>Zone</span>
                                    <strong>{riderSession.zone || 'Zone not set'}</strong>
                                </div>
                                <div>
                                    <span>Map mode</span>
                                    <strong>{liveRiderLocation ? 'Live device location' : 'Auto route preview'}</strong>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </section>
    );
}
