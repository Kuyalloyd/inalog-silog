import { formatCurrency, formatShortDate } from '../../lib/formatting';
import useCustomerPanelData from '../../hooks/useCustomerPanelData';

export default function FavoritesPage() {
    const { member, featuredPicks, addItem, itemCount, grandTotal } = useCustomerPanelData();

    if (!member) {
        return (
            <section className="page-section">
                <div className="panel-card dashboard-guest">
                    <p className="eyebrow">Favorites</p>
                    <h1 className="panel-card__title">Mag-login para makita ang favorites mo.</h1>
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
                        <p className="dashboard-panel__eyebrow">Favorites</p>
                        <h1 className="dashboard-showcase__title">Reorder your best picks faster.</h1>
                        <p className="dashboard-showcase__text">Keep your go-to meals close so you can add them to the basket in just one tap.</p>

                        <div className="dashboard-showcase__chips">
                            <span>{featuredPicks.length} saved picks</span>
                            <span>{itemCount} item(s) in basket</span>
                            <span>Updated {formatShortDate(member.created_at)}</span>
                        </div>

                        <div className="customer-workspace-banner__actions">
                            <a className="button-link" href="/dashboard/menu">
                                Open menu
                            </a>
                            <a className="button-link--ghost" href="/checkout">
                                Checkout
                            </a>
                            <a className="button-link--ghost" href="/dashboard">
                                Dashboard
                            </a>
                        </div>

                        <div className="customer-workspace-kpis">
                            <div className="customer-workspace-kpi">
                                <strong>{featuredPicks.length}</strong>
                                <span>Favorite picks</span>
                            </div>
                            <div className="customer-workspace-kpi">
                                <strong>{itemCount}</strong>
                                <span>Basket items</span>
                            </div>
                            <div className="customer-workspace-kpi">
                                <strong>{formatCurrency(grandTotal)}</strong>
                                <span>Basket total</span>
                            </div>
                            <div className="customer-workspace-kpi">
                                <strong>{featuredPicks[0]?.name || 'No pick'}</strong>
                                <span>Top pick</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-showcase__panel">
                        <article className="dashboard-status-card">
                            <div className="dashboard-status-card__top">
                                <p>Best pick</p>
                                <span>Favorite</span>
                            </div>
                            <strong>{featuredPicks[0]?.name || 'No favorite yet'}</strong>
                            <p>{featuredPicks[0] ? formatCurrency(featuredPicks[0].price) : 'Choose a meal from the menu.'}</p>
                        </article>

                        <article className="dashboard-status-card dashboard-status-card--soft">
                            <div className="dashboard-status-card__top">
                                <p>Basket</p>
                                <span>{itemCount > 0 ? 'Ready' : 'Empty'}</span>
                            </div>
                            <strong>{itemCount > 0 ? formatCurrency(grandTotal) : 'Empty basket'}</strong>
                            <p>{itemCount > 0 ? `${itemCount} item(s) ready for checkout.` : 'Add a favorite meal to start your next order.'}</p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="page-section">
                <article className="customer-workspace-card">
                    <div className="dashboard-panel__header">
                        <div>
                            <p className="dashboard-panel__eyebrow">Favorite meals</p>
                            <h2 className="panel-card__title">Quick reorder list</h2>
                        </div>
                    </div>

                    <div className="dashboard-reorder-grid">
                        {featuredPicks.map((item) => (
                            <article className="dashboard-reorder-card" key={item.name}>
                                <img src={item.image} alt={item.name} />
                                <div className="customer-dashboard__favorite-copy">
                                    <strong>{item.name}</strong>
                                    <p>{item.description}</p>
                                </div>
                                <div className="dashboard-reorder-card__footer">
                                    <span>{formatCurrency(item.price)}</span>
                                    <button className="button-link--basket" type="button" onClick={() => addItem(item)}>
                                        <span className="button-link--basket__icon" aria-hidden="true">
                                            +
                                        </span>
                                        <span className="button-link--basket__label">Idagdag sa basket</span>
                                        <span className="button-link--basket__trail" aria-hidden="true">
                                            {'>'}
                                        </span>
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </article>
            </section>
        </>
    );
}
