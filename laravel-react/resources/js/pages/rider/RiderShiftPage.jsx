import useRiderPanelData from '../../hooks/useRiderPanelData';
import { formatShortDate } from '../../lib/formatting';

export default function RiderShiftPage() {
    const { riderSession, riderName, riderVehicle, riderCode, riderZone, riderStats, availableOrders, queue, isLiveDelivery } = useRiderPanelData();

    if (!riderSession) {
        return (
            <section className="page-section">
                <div className="panel-card dashboard-guest">
                    <p className="eyebrow">Shift</p>
                    <h1 className="panel-card__title">Open rider dispatch first.</h1>
                    <p className="form-card__text">Shift details open after rider sign-in.</p>
                    <div className="page-hero__actions">
                        <a className="button-link" href="/rider">
                            Open rider panel
                        </a>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="page-section">
                <div className="rider-panel-head">
                    <div className="rider-panel-head__main">
                        <p className="rider-dispatch__eyebrow">Shift</p>
                        <h1>{riderName}</h1>
                        <p>{availableOrders.length > 0 ? 'Your shift is live and customer delivery orders are waiting in dispatch.' : 'Vehicle, zone, and shift controls.'}</p>
                    </div>

                    <div className="rider-panel-head__rail">
                        <div className="rider-panel-head__stats">
                            {riderStats.map((stat) => (
                                <div key={stat.label}>
                                    <strong>{stat.value}</strong>
                                    <span>{stat.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="rider-panel-head__actions">
                            <a className="button-link" href="/rider/map">
                                Map
                            </a>
                            <a className="button-link--ghost" href="/rider">
                                Dispatch
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {availableOrders.length > 0 ? (
                <section className="page-section">
                    <div className="note-strip note-strip--soft rider-note-strip">
                        <strong>{availableOrders.length} order(s) waiting for riders</strong>
                        <span>Customer deliveries are ready in the rider queue. Open Orders to claim one and move it into your assigned stops.</span>
                    </div>
                </section>
            ) : null}

            <section className="page-section dashboard-grid">
                <section className="tracking-info-card">
                    <div className="tracking-card__head">
                        <div>
                            <p className="tracking-card__kicker">Shift details</p>
                            <h2>{riderName}</h2>
                        </div>
                    </div>

                    <div className="tracking-info-list">
                        <div>
                            <span>Rider code</span>
                            <strong>{riderCode}</strong>
                        </div>
                        <div>
                            <span>Vehicle</span>
                            <strong>{riderVehicle}</strong>
                        </div>
                        <div>
                            <span>Zone</span>
                            <strong>{riderZone}</strong>
                        </div>
                        <div>
                            <span>Shift started</span>
                            <strong>{formatShortDate(riderSession.startedAt)}</strong>
                        </div>
                        <div>
                            <span>Contact number</span>
                            <strong>{riderSession.contactNumber}</strong>
                        </div>
                    </div>
                </section>

                <section className="panel-card">
                    <h3 className="panel-card__title">Shift actions</h3>
                    <div className="rider-panel-mini-grid">
                        <div className="mini-item">
                            <strong>Map</strong>
                            <span>Open live route view.</span>
                        </div>
                        <div className="mini-item">
                            <strong>Orders</strong>
                            <span>{availableOrders.length > 0 ? `${availableOrders.length} waiting to claim.` : queue.length > 0 ? `${queue.length} assigned stop(s).` : 'Check assigned orders.'}</span>
                        </div>
                        <div className="mini-item">
                            <strong>Status</strong>
                            <span>{isLiveDelivery ? 'Live delivery in progress.' : 'Standby for the next dispatch.'}</span>
                        </div>
                    </div>

                    <div className="page-hero__actions">
                        <a className="button-link" href="/rider/queue">
                            Open orders
                        </a>
                        <a className="button-link--ghost" href="/logout">
                            Logout
                        </a>
                    </div>
                </section>
            </section>
        </>
    );
}
