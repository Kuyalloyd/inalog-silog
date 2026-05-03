import useRiderPanelData from '../../hooks/useRiderPanelData';
import { formatCurrency } from '../../lib/formatting';

export default function RiderQueuePage() {
    const { riderSession, queue, activeDrop, availableOrders, riderStats, claimOrder, completeCurrentOrder } = useRiderPanelData();

    if (!riderSession) {
        return (
            <section className="page-section">
                <div className="panel-card dashboard-guest">
                    <p className="eyebrow">Orders</p>
                    <h1 className="panel-card__title">Open rider dispatch first.</h1>
                    <p className="form-card__text">The rider orders page opens after rider sign-in.</p>
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
                        <p className="rider-dispatch__eyebrow">Orders</p>
                        <h1>{queue.length > 0 ? `${queue.length} active orders` : `${availableOrders.length} waiting orders`}</h1>
                        <p>{availableOrders.length > 0 ? 'New customer orders are waiting to be claimed below.' : 'Next stop first, then the rest of the assigned orders.'}</p>
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
                            {queue.length > 0 ? (
                                <button className="button-link--ghost" type="button" onClick={() => completeCurrentOrder()}>
                                    Mark delivered
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>

            {availableOrders.length > 0 ? (
                <section className="page-section">
                    <div className="note-strip note-strip--soft rider-note-strip">
                        <strong>{availableOrders.length} delivery order(s) ready for pickup</strong>
                        <span>These came from customer checkout and are now waiting in your rider queue. Tap Get order to take the delivery.</span>
                    </div>
                </section>
            ) : null}

            <section className="page-section tracking-grid">
                <section className="tracking-info-card">
                    <div className="tracking-card__head">
                        <div>
                            <p className="tracking-card__kicker">Next customer</p>
                            <h2>{activeDrop.customer}</h2>
                        </div>
                    </div>

                    <div className="tracking-info-list">
                        <div>
                            <span>Address</span>
                            <strong>{activeDrop.address}</strong>
                        </div>
                        <div>
                            <span>Landmark</span>
                            <strong>{activeDrop.landmark}</strong>
                        </div>
                        <div>
                            <span>Payment</span>
                            <strong>{activeDrop.payment}</strong>
                        </div>
                        <div>
                            <span>Total</span>
                            <strong>{activeDrop.total > 0 ? formatCurrency(activeDrop.total) : '--'}</strong>
                        </div>
                    </div>
                </section>

                <section className="tracking-info-card">
                    <div className="tracking-card__head">
                        <div>
                            <p className="tracking-card__kicker">Orders</p>
                            <h2>Assigned stops</h2>
                        </div>
                    </div>

                    <div className="tracking-order-list">
                        {queue.length > 0 ? (
                            queue.map((drop) => (
                                <div className="tracking-order-row rider-queue-row" key={drop.code}>
                                    <div>
                                        <strong>{drop.code}</strong>
                                        <p className="rider-queue-row__copy">
                                            {drop.customer} | {drop.address}
                                        </p>
                                    </div>
                                    <div className="rider-queue-row__meta">
                                        <span className={`table-list__status table-list__status--${drop.tone}`}>{drop.status}</span>
                                        <strong>{drop.eta}</strong>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="dashboard-empty dashboard-empty--soft">
                                <strong>No assigned stops</strong>
                                <span>Claim a checkout order first so it appears in your rider orders.</span>
                            </div>
                        )}
                    </div>
                </section>

                <section className="tracking-info-card">
                    <div className="tracking-card__head">
                        <div>
                            <p className="tracking-card__kicker">Open checkout</p>
                            <h2>Orders waiting for riders</h2>
                        </div>
                    </div>

                    <div className="tracking-order-list">
                        {availableOrders.length > 0 ? (
                            availableOrders.map((drop) => (
                                <div className="tracking-order-row rider-queue-row rider-queue-row--claim" key={drop.code}>
                                    <div>
                                        <strong>{drop.code}</strong>
                                        <p className="rider-queue-row__copy">
                                            {drop.customer} | {drop.address}
                                        </p>
                                    </div>
                                    <div className="rider-queue-row__meta">
                                        <span className={`table-list__status table-list__status--${drop.tone}`}>{drop.payment}</span>
                                        <strong>{formatCurrency(drop.total)}</strong>
                                        <button className="button-link" type="button" onClick={() => claimOrder(drop.code)}>
                                            Get order
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="dashboard-empty dashboard-empty--soft">
                                <strong>No open checkout orders</strong>
                                <span>New customer checkouts will appear here automatically.</span>
                            </div>
                        )}
                    </div>
                </section>
            </section>
        </>
    );
}
