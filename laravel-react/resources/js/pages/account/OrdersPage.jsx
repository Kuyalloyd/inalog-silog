import useCustomerPanelData from '../../hooks/useCustomerPanelData';
import { formatCurrency, formatDateTime } from '../../lib/formatting';

export default function OrdersPage() {
    const { member, itemCount, recentOrders, latestOrder, latestOrderItems, statusStep, grandTotal, etaText } = useCustomerPanelData();

    if (!member) {
        return (
            <section className="page-section">
                <div className="panel-card dashboard-guest">
                    <p className="eyebrow">Orders</p>
                    <h1 className="panel-card__title">Mag-login para makita ang orders mo.</h1>
                    <p className="form-card__text">Open your customer panel.</p>
                    <div className="page-hero__actions">
                        <a className="button-link" href="/login">
                            Mag-login
                        </a>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="page-section">
                <div className="dashboard-showcase customer-workspace-banner">
                    <div>
                        <p className="dashboard-panel__eyebrow">Orders</p>
                        <h1 className="dashboard-showcase__title">Live order status.</h1>
                        <p className="dashboard-showcase__text">Track the active order and recent history in one place.</p>

                        <div className="dashboard-showcase__chips">
                            <span>{latestOrder?.id || 'No active reference'}</span>
                            <span>{latestOrder?.status || 'Waiting'}</span>
                            <span>{etaText}</span>
                        </div>

                        <div className="customer-workspace-banner__actions">
                            <a className="button-link" href="/track-order">
                                Live tracker
                            </a>
                            <a className="button-link--ghost" href="/dashboard/menu">
                                Food menu
                            </a>
                            <a className="button-link--ghost" href="/dashboard">
                                Dashboard
                            </a>
                        </div>

                        <div className="customer-workspace-kpis">
                            <div className="customer-workspace-kpi">
                                <strong>{recentOrders.length}</strong>
                                <span>Recent orders</span>
                            </div>
                            <div className="customer-workspace-kpi">
                                <strong>{itemCount}</strong>
                                <span>Basket items</span>
                            </div>
                            <div className="customer-workspace-kpi">
                                <strong>{latestOrder?.status || 'Waiting'}</strong>
                                <span>Current status</span>
                            </div>
                            <div className="customer-workspace-kpi">
                                <strong>{latestOrder?.id || 'No order'}</strong>
                                <span>Reference</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-showcase__panel">
                        <article className="dashboard-status-card">
                            <div className="dashboard-status-card__top">
                                <p>Current</p>
                                <span>{latestOrder?.id || 'Waiting'}</span>
                            </div>
                            <strong>{latestOrder ? latestOrder.status : itemCount > 0 ? 'Basket ready' : 'No active order'}</strong>
                            <p>{latestOrder ? `${latestOrder.itemCount} item(s) in progress.` : itemCount > 0 ? `${itemCount} item(s) ready.` : 'Ready for a new order.'}</p>
                        </article>

                        <article className="dashboard-status-card dashboard-status-card--soft">
                            <div className="dashboard-status-card__top">
                                <p>Total</p>
                                <span>{etaText}</span>
                            </div>
                            <strong>{latestOrder ? formatCurrency(latestOrder.total) : formatCurrency(grandTotal)}</strong>
                            <p>{latestOrder ? formatDateTime(latestOrder.createdAt) : 'Start from the food menu to create an order.'}</p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="page-section">
                <div className="dashboard-columns">
                    <div className="dashboard-primary">
                        <article className="customer-workspace-card customer-dashboard__order-card customer-dashboard__order-card--track">
                            <div className="dashboard-panel__header">
                                <div>
                                    <p className="dashboard-panel__eyebrow">Current status</p>
                                    <h2 className="panel-card__title">Live order progress</h2>
                                </div>
                            </div>

                            <div className="customer-dashboard__track-top">
                                <div>
                                    <p className="customer-dashboard__kicker">Current status</p>
                                    <h3>{latestOrder ? latestOrder.status : itemCount > 0 ? 'Inaayos ang basket' : 'Wala pang active order'}</h3>
                                </div>
                                <span>{latestOrder ? latestOrder.id : 'Basket mode'}</span>
                            </div>

                            <p className="customer-dashboard__track-copy">
                                {latestOrder
                                    ? `${formatDateTime(latestOrder.createdAt)} | ${latestOrder.itemCount} item | ${formatCurrency(latestOrder.total)}`
                                    : itemCount > 0
                                      ? `${itemCount} item sa basket`
                                      : 'Wala pang active order.'}
                            </p>

                            <div className="customer-dashboard__steps">
                                {['Na-order na', 'Inihahanda', 'Paparating na', 'Na-deliver na'].map((step, index) => (
                                    <div
                                        className={index <= statusStep ? 'customer-dashboard__step customer-dashboard__step--active' : 'customer-dashboard__step'}
                                        key={step}
                                    >
                                        <span>{index + 1}</span>
                                        <strong>{step}</strong>
                                    </div>
                                ))}
                            </div>

                            <div className="customer-dashboard__mini-items">
                                {latestOrderItems.length > 0 ? (
                                    latestOrderItems.map((item) => (
                                        <div className="customer-dashboard__mini-order" key={item.name}>
                                            <strong>{item.name}</strong>
                                            <span>
                                                {(item.quantity || 1)} x {formatCurrency(item.price)}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="customer-dashboard__mini-order customer-dashboard__mini-order--empty">
                                        <strong>Wala pang current items</strong>
                                        <span>Open the food menu to start an order.</span>
                                    </div>
                                )}
                            </div>
                        </article>
                    </div>

                    <aside className="dashboard-secondary">
                        <article className="customer-workspace-card">
                            <div className="dashboard-panel__header">
                                <div>
                                    <p className="dashboard-panel__eyebrow">Recent history</p>
                                    <h2 className="panel-card__title">Mga huling order</h2>
                                </div>
                            </div>

                            {recentOrders.length > 0 ? (
                                <div className="customer-dashboard__history-list">
                                    {recentOrders.slice(0, 6).map((order) => (
                                        <div className="customer-dashboard__history-row" key={order.id}>
                                            <div>
                                                <strong>{order.id}</strong>
                                                <p>
                                                    {formatDateTime(order.createdAt)} | {order.mode === 'delivery' ? 'Delivery' : 'Pick-up'}
                                                </p>
                                            </div>
                                            <div className="customer-dashboard__history-meta">
                                                <span>{order.status}</span>
                                                <strong>{formatCurrency(order.total)}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="dashboard-empty dashboard-empty--soft">
                                    <strong>Wala ka pang saved orders</strong>
                                    <span>Lalabas dito ang recent order history mo.</span>
                                </div>
                            )}
                        </article>
                    </aside>
                </div>
            </section>
        </>
    );
}
