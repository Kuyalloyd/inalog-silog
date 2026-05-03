import { useState } from 'react';
import DemoForm from '../../components/DemoForm';
import PanelSearchBar from '../../components/PanelSearchBar';
import useRiderPanelData from '../../hooks/useRiderPanelData';
import { formatCurrency } from '../../lib/formatting';
import { saveRiderSession } from '../../lib/riderSession';

function matchesDeliveryDrop(drop, query) {
    return [drop.customer, drop.code, drop.address, drop.landmark, drop.payment, drop.status, drop.riderName, drop.riderVehicle]
        .join(' ')
        .toLowerCase()
        .includes(query);
}

async function openRiderPanel(values) {
    if (!values.riderName) {
        throw new Error('Ilagay ang rider name bago buksan ang rider panel.');
    }

    const riderSession = saveRiderSession(values);

    if (!riderSession) {
        throw new Error('Hindi nabuo ang rider session. Pakisubukang muli.');
    }

    return {
        successMessage: 'Rider shift ready. Redirecting to the rider panel...',
        redirectTo: '/rider?entry=login',
        resetForm: false,
    };
}

export default function RiderPage() {
    const { riderSession, activeOrder, riderName, riderVehicle, riderZone, riderCode, riderStats, activeDrop, queue, availableOrders, isLiveDelivery, claimOrder, completeCurrentOrder } = useRiderPanelData();
    const [riderSearch, setRiderSearch] = useState('');
    const normalizedRiderSearch = riderSearch.trim().toLowerCase();
    const filteredAvailableOrders = normalizedRiderSearch ? availableOrders.filter((drop) => matchesDeliveryDrop(drop, normalizedRiderSearch)) : availableOrders;
    const filteredQueue = normalizedRiderSearch ? queue.filter((drop) => matchesDeliveryDrop(drop, normalizedRiderSearch)) : queue;
    const showLoginPanel =
        typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('entry') === 'login';
    const isCompletedDelivery = String(activeOrder?.status || '').toLowerCase().includes('deliver');

    if (!riderSession) {
        return (
            <section className="page-section">
                <div className="rider-access">
                    <div className="rider-access__info">
                        <p className="rider-access__eyebrow">Rider sign-in</p>
                        <h1>Open dispatch.</h1>
                        <p>Map, orders, and shift tools in one rider workspace.</p>

                        <div className="rider-access__highlights">
                            <div>
                                <strong>Live map</strong>
                                <span>Delivery route</span>
                            </div>
                            <div>
                                <strong>Orders</strong>
                                <span>Open orders</span>
                            </div>
                            <div>
                                <strong>Shift</strong>
                                <span>Vehicle and zone</span>
                            </div>
                        </div>
                    </div>

                    <div className="rider-access__form">
                        <DemoForm
                            variant="auth"
                            title="Start rider shift"
                            description="Enter rider details to open dispatch."
                            submitLabel="Open rider panel"
                            submittingLabel="Opening rider panel..."
                            successMessage="Rider shift active."
                            idleMessage="Use this to start the rider workspace."
                            onSubmit={openRiderPanel}
                            fields={[
                                {
                                    name: 'riderName',
                                    label: 'Rider name',
                                    type: 'text',
                                    placeholder: 'Marco Dela Cruz',
                                    required: true,
                                    autoComplete: 'name',
                                },
                                {
                                    name: 'riderCode',
                                    label: 'Rider code',
                                    type: 'text',
                                    placeholder: 'RDR-204',
                                    autoComplete: 'off',
                                },
                                {
                                    name: 'vehicle',
                                    label: 'Vehicle',
                                    type: 'select',
                                    placeholder: 'Choose vehicle',
                                    options: ['Motorbike', 'E-bike', 'Car'],
                                },
                                {
                                    name: 'zone',
                                    label: 'Delivery zone',
                                    type: 'select',
                                    placeholder: 'Choose route zone',
                                    options: ['Butuan Central Route', 'Libertad Route', 'Ampayon Route', 'Downtown Route'],
                                },
                                {
                                    name: 'contactNumber',
                                    label: 'Contact number',
                                    type: 'text',
                                    placeholder: '0917 000 0000',
                                    autoComplete: 'tel',
                                },
                            ]}
                        />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="page-section">
            <div className="rider-dispatch">
                {showLoginPanel ? (
                    <div className="note-strip note-strip--soft">
                        <strong>Shift started</strong>
                        <span>{riderSession.riderName} is active.</span>
                    </div>
                ) : null}

                {availableOrders.length > 0 ? (
                    <div className="note-strip note-strip--soft rider-note-strip">
                        <strong>{availableOrders.length} delivery order(s) waiting</strong>
                        <span>Customer checkout orders now appear here automatically. Open the queue below and tap Get order to take a delivery.</span>
                    </div>
                ) : null}

                {isCompletedDelivery ? (
                    <div className="note-strip note-strip--soft rider-note-strip">
                        <strong>Delivery completed</strong>
                        <span>{activeOrder?.customerName || 'The customer'} already received this order. You can open the map page to view the delivered route summary.</span>
                    </div>
                ) : null}

                <section className="rider-dispatch__hero">
                    <div className="rider-dispatch__copy">
                        <p className="rider-dispatch__eyebrow">Dispatch</p>
                        <h1>Hi, {riderName}.</h1>
                        <p>
                            {isLiveDelivery
                                ? 'Current stop and assigned orders are live.'
                                : availableOrders.length > 0
                                  ? 'Customer delivery orders are waiting. Take one below to start your route.'
                                  : 'Waiting for the next customer checkout order.'}
                        </p>

                        <div className="rider-dispatch__chips">
                            <span>{riderCode}</span>
                            <span>{riderVehicle}</span>
                            <span>{riderZone}</span>
                        </div>

                        <div className="rider-dispatch__actions">
                            <a className="button-link" href="/rider/map">
                                Map
                            </a>
                            <a className="button-link--ghost" href="/rider/queue">
                                Orders
                            </a>
                            {isLiveDelivery ? (
                                <button className="button-link--ghost" type="button" onClick={() => completeCurrentOrder()}>
                                    Mark delivered
                                </button>
                            ) : null}
                            <a className="button-link--ghost" href="/logout">
                                Logout
                            </a>
                        </div>

                        <PanelSearchBar
                            label="Search delivery board"
                            placeholder="Search customer, code, address, or payment"
                            value={riderSearch}
                            onChange={setRiderSearch}
                            hint={
                                normalizedRiderSearch
                                    ? `${filteredAvailableOrders.length + filteredQueue.length} matching stop(s)`
                                    : `${availableOrders.length} open and ${queue.length} assigned`
                            }
                            tone="rider"
                        />
                    </div>

                    <aside className="rider-dispatch__panel">
                        <div className="rider-dispatch__next-stop">
                            <span>{isLiveDelivery ? 'Next stop' : availableOrders.length > 0 ? 'Orders waiting' : 'Dispatch board'}</span>
                            <strong>{activeDrop.customer}</strong>
                            <p>{activeDrop.code} | {activeDrop.address}</p>
                        </div>
                        <div className="rider-dispatch__metrics">
                            {riderStats.map((stat) => (
                                <div key={stat.label}>
                                    <strong>{stat.value}</strong>
                                    <span>{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </aside>
                </section>

                <div className="rider-dispatch__grid">
                    <section className="rider-dispatch__card">
                        <div className="rider-dispatch__card-head">
                            <div>
                                <p>{isLiveDelivery ? 'Current stop' : 'Dispatch status'}</p>
                                <h2>{activeDrop.customer}</h2>
                            </div>
                            <span className={`table-list__status table-list__status--${activeDrop.tone}`}>{activeDrop.status}</span>
                        </div>

                        <div className="rider-dispatch__stop-grid">
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

                    <aside className="rider-dispatch__card">
                        <div className="rider-dispatch__card-head">
                            <div>
                                <p>Shift</p>
                                <h2>{isLiveDelivery ? 'Live delivery' : 'Standby'}</h2>
                            </div>
                        </div>
                        <div className="rider-dispatch__status-list">
                            <div>
                                <span>Vehicle</span>
                                <strong>{riderVehicle}</strong>
                            </div>
                            <div>
                                <span>Open checkout</span>
                                <strong>{availableOrders.length} order(s)</strong>
                            </div>
                            <div>
                                <span>Assigned orders</span>
                                <strong>{queue.length} stop(s)</strong>
                            </div>
                        </div>
                    </aside>
                </div>

                <div className="rider-dispatch__grid rider-dispatch__grid--queues">
                    <section className="rider-dispatch__card">
                        <div className="rider-dispatch__card-head">
                            <div>
                                <p>Available checkout</p>
                                <h2>Claim new delivery orders</h2>
                            </div>
                            <a className="dashboard-panel__link" href="/rider/queue">
                                Orders page
                            </a>
                        </div>

                        <div className="rider-dispatch__queue">
                            {filteredAvailableOrders.length > 0 ? (
                                filteredAvailableOrders.map((drop) => (
                                    <article className="rider-dispatch__queue-row rider-dispatch__queue-row--action" key={drop.code}>
                                        <div>
                                            <strong>{drop.customer}</strong>
                                            <p>
                                                {drop.code} | {drop.address}
                                            </p>
                                        </div>
                                        <div className="rider-dispatch__queue-meta">
                                            <span className={`table-list__status table-list__status--${drop.tone}`}>{drop.payment}</span>
                                            <strong>{formatCurrency(drop.total)}</strong>
                                            <button className="button-link" type="button" onClick={() => claimOrder(drop.code)}>
                                                Get order
                                            </button>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="dashboard-empty dashboard-empty--soft">
                                    <strong>{normalizedRiderSearch ? 'No matching checkout orders' : 'No open checkout orders'}</strong>
                                    <span>{normalizedRiderSearch ? 'Try another customer, code, or address.' : 'New delivery checkouts will appear here for riders to claim.'}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="rider-dispatch__card">
                        <div className="rider-dispatch__card-head">
                            <div>
                                <p>Assigned orders</p>
                                <h2>Your delivery stops</h2>
                            </div>
                        </div>

                        <div className="rider-dispatch__queue">
                            {filteredQueue.length > 0 ? (
                                filteredQueue.map((drop) => (
                                    <article className="rider-dispatch__queue-row" key={drop.code}>
                                        <div>
                                            <strong>{drop.customer}</strong>
                                            <p>
                                                {drop.code} | {drop.address}
                                            </p>
                                        </div>
                                        <div className="rider-dispatch__queue-meta">
                                            <span className={`table-list__status table-list__status--${drop.tone}`}>{drop.status}</span>
                                            <strong>{drop.eta}</strong>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="dashboard-empty dashboard-empty--soft">
                                    <strong>{normalizedRiderSearch ? 'No matching assigned stops' : 'No assigned stops yet'}</strong>
                                    <span>{normalizedRiderSearch ? 'Try another search term for rider orders.' : 'Pick a checkout order above to move it into your assigned orders.'}</span>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </section>
    );
}
