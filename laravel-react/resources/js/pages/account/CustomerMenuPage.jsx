import { useState } from 'react';
import MenuSection from '../../components/MenuSection';
import PanelSearchBar from '../../components/PanelSearchBar';
import { useCart } from '../../context/CartContext';
import { getFeaturedMenuItems, getMenuItemsByCategory, menuItems, menuSections } from '../../data/menuData';
import useCustomerPanelData from '../../hooks/useCustomerPanelData';
import { formatCurrency } from '../../lib/formatting';

function matchesMenuItem(item, query) {
    return [item.name, item.description, item.badge, item.category].some((value) => value?.toLowerCase().includes(query));
}

export default function CustomerMenuPage() {
    const { member, itemCount, grandTotal, etaText } = useCustomerPanelData();
    const { items, subtotal, deliveryFee, orderMode, removeItem, setOrderMode } = useCart();
    const featuredHighlights = getFeaturedMenuItems().slice(0, 3);
    const sections = menuSections.map((section) => ({
        ...section,
        items: getMenuItemsByCategory(section.key),
    }));
    const [activeSectionKey, setActiveSectionKey] = useState(sections[0]?.key ?? '');
    const [menuSearch, setMenuSearch] = useState('');
    const normalizedMenuSearch = menuSearch.trim().toLowerCase();
    const activeSection = sections.find((section) => section.key === activeSectionKey) ?? sections[0];
    const activeItems = activeSection?.items ?? [];
    const matchedItems = normalizedMenuSearch ? menuItems.filter((item) => matchesMenuItem(item, normalizedMenuSearch)) : activeItems;
    const displaySection = normalizedMenuSearch
        ? {
              slug: 'menu-search-results',
              eyebrow: 'Search results',
              title: `Results for "${menuSearch.trim()}"`,
              subtitle: 'Matching meals across all customer menu categories.',
          }
        : activeSection;
    const displayItems = displaySection ? matchedItems : [];
    const activeHighlight = normalizedMenuSearch
        ? displayItems[0] ?? null
        : featuredHighlights.find((item) => item.category === activeSection?.key) ?? activeItems[0] ?? featuredHighlights[0];

    if (!member) {
        return (
            <section className="page-section">
                <div className="panel-card dashboard-guest">
                    <p className="eyebrow">Menu</p>
                    <h1 className="panel-card__title">Mag-login para makita ang customer menu mo.</h1>
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
                        <p className="dashboard-panel__eyebrow">Food menu</p>
                        <h1 className="dashboard-showcase__title">Pick your next meal.</h1>
                        <p className="dashboard-showcase__text">Switch categories fast, add to basket, and move straight into checkout.</p>

                        <div className="dashboard-showcase__chips">
                            <span>{menuItems.length}+ dishes</span>
                            <span>{orderMode === 'delivery' ? 'Delivery' : 'Pick-up'}</span>
                            <span>{etaText}</span>
                        </div>

                        <div className="customer-workspace-banner__actions">
                            <a className="button-link" href="/checkout">
                                Checkout
                            </a>
                            <a className="button-link--ghost" href="/dashboard/orders">
                                Orders
                            </a>
                            <a className="button-link--ghost" href="/dashboard">
                                Dashboard
                            </a>
                        </div>

                        <div className="customer-workspace-kpis">
                            <div className="customer-workspace-kpi">
                                <strong>{menuItems.length}+</strong>
                                <span>Dishes</span>
                            </div>
                            <div className="customer-workspace-kpi">
                                <strong>{itemCount}</strong>
                                <span>Basket items</span>
                            </div>
                            <div className="customer-workspace-kpi">
                                <strong>{etaText}</strong>
                                <span>ETA</span>
                            </div>
                            <div className="customer-workspace-kpi">
                                <strong>{formatCurrency(grandTotal || subtotal)}</strong>
                                <span>Total</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-showcase__panel">
                        <article className="dashboard-status-card">
                            <div className="dashboard-status-card__top">
                                <p>Order mode</p>
                                <span>{itemCount > 0 ? `${itemCount} item(s)` : 'Ready'}</span>
                            </div>
                            <strong>{orderMode === 'delivery' ? 'Delivery' : 'Pick-up'}</strong>
                            <p>Switch modes anytime before checkout.</p>
                        </article>

                        <article className="dashboard-status-card dashboard-status-card--soft">
                            <div className="dashboard-status-card__top">
                                <p>Basket total</p>
                                <span>{itemCount > 0 ? 'Live total' : 'Empty'}</span>
                            </div>
                            <strong>{itemCount > 0 ? formatCurrency(grandTotal) : 'Empty basket'}</strong>
                            <p>{itemCount > 0 ? 'Continue to checkout when you are ready.' : 'Choose a meal to start building your order.'}</p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="page-section">
                <div className="order-experience">
                    <div className="order-experience__copy">
                        <p className="eyebrow">Order mode</p>
                        <h2 className="section-heading__title">Delivery or pick-up.</h2>
                        <p className="section-heading__text">Choose your preferred order mode, then add meals to the basket.</p>
                    </div>

                    <div className="order-experience__tools">
                        <div className="order-mode-toggle" aria-label="Paraan ng order">
                            <button
                                className={orderMode === 'delivery' ? 'order-mode-toggle__button order-mode-toggle__button--active' : 'order-mode-toggle__button'}
                                type="button"
                                onClick={() => setOrderMode('delivery')}
                            >
                                Delivery
                            </button>
                            <button
                                className={orderMode === 'pickup' ? 'order-mode-toggle__button order-mode-toggle__button--active' : 'order-mode-toggle__button'}
                                type="button"
                                onClick={() => setOrderMode('pickup')}
                            >
                                Pick-up
                            </button>
                        </div>

                        <div className="order-experience__stats">
                            <div>
                                <strong>{itemCount || 0}</strong>
                                <span>Basket</span>
                            </div>
                            <div>
                                <strong>{etaText}</strong>
                                <span>ETA</span>
                            </div>
                            <div>
                                <strong>{formatCurrency(grandTotal || subtotal)}</strong>
                                <span>Total</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="menu-market">
                    <div className="menu-market__main">
                        <nav className="menu-nav" aria-label="Mga seksyon ng menu">
                            {sections.map((section) => (
                                <button
                                    className={section.key === activeSection?.key ? 'menu-nav__link menu-nav__link--active' : 'menu-nav__link'}
                                    type="button"
                                    key={section.key}
                                    onClick={() => setActiveSectionKey(section.key)}
                                >
                                    <span>{section.navLabel}</span>
                                    <span className="menu-nav__count">{section.items.length}</span>
                                </button>
                            ))}
                        </nav>

                        {activeSection ? (
                            <div className="menu-market__section-shell">
                                <div className="menu-market__section-head">
                                    <div>
                                        <p className="menu-market__eyebrow">{normalizedMenuSearch ? 'Search results' : 'Now serving'}</p>
                                        <h2>{displaySection.title}</h2>
                                        <p>{displaySection.subtitle}</p>
                                    </div>

                                    <div className="menu-market__section-side">
                                        <PanelSearchBar
                                            label="Search meals"
                                            placeholder="Search dishes, category, or tag"
                                            value={menuSearch}
                                            onChange={setMenuSearch}
                                            hint={normalizedMenuSearch ? `${displayItems.length} match(es)` : `${activeItems.length} dish(es) in ${activeSection.navLabel}`}
                                            tone="account"
                                        />

                                        <div className="menu-market__summary">
                                            <div className="menu-market__summary-card">
                                                <strong>{displayItems.length}</strong>
                                                <span>{normalizedMenuSearch ? 'Matches' : 'Dishes'}</span>
                                            </div>
                                            <div className="menu-market__summary-card">
                                                <strong>{itemCount}</strong>
                                                <span>Basket</span>
                                            </div>
                                            <div className="menu-market__summary-card">
                                                <strong>{orderMode === 'delivery' ? 'Delivery' : 'Pick-up'}</strong>
                                                <span>Mode</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {activeHighlight ? (
                                    <article className="menu-market__feature-card">
                                        <img src={activeHighlight.image} alt={activeHighlight.name} />
                                        <div className="menu-market__feature-copy">
                                            <p className="menu-market__eyebrow">Quick pick</p>
                                            <h3>{activeHighlight.name}</h3>
                                            <p>{activeHighlight.description}</p>
                                            <div className="menu-market__feature-meta">
                                                <span>{formatCurrency(activeHighlight.price)}</span>
                                                <span>{activeHighlight.badge}</span>
                                            </div>
                                        </div>
                                    </article>
                                ) : null}

                                {displayItems.length > 0 ? (
                                    <MenuSection section={displaySection} items={displayItems} compact />
                                ) : (
                                    <div className="dashboard-empty dashboard-empty--soft">
                                        <strong>No meals found</strong>
                                        <span>Try another dish name, category, or tag.</span>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <aside className="basket-rail">
                        <div className="basket-rail__card">
                            <div className="basket-rail__header">
                                <div>
                                    <p className="basket-rail__eyebrow">Basket</p>
                                    <h3>Current order</h3>
                                </div>
                                <span className="basket-rail__pill">{orderMode === 'delivery' ? 'Padala' : 'Pick-up'}</span>
                            </div>

                            {items.length > 0 ? (
                                <>
                                    <div className="basket-rail__list">
                                        {items.map((item) => (
                                            <div className="basket-rail__item" key={item.name}>
                                                <img src={item.image} alt={item.name} />
                                                <div>
                                                    <strong>{item.name}</strong>
                                                    <p>
                                                        {item.quantity} x {formatCurrency(item.price)}
                                                    </p>
                                                </div>
                                                <button type="button" onClick={() => removeItem(item.name)}>
                                                    Alisin
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="basket-rail__totals">
                                        <div>
                                            <span>Subtotal</span>
                                            <strong>{formatCurrency(subtotal)}</strong>
                                        </div>
                                        <div>
                                            <span>Delivery fee</span>
                                            <strong>{formatCurrency(deliveryFee)}</strong>
                                        </div>
                                        <div className="basket-rail__totals-row basket-rail__totals-row--grand">
                                            <span>Total</span>
                                            <strong>{formatCurrency(grandTotal)}</strong>
                                        </div>
                                    </div>

                                    <a className="button-link basket-rail__cta" href="/checkout">
                                        Checkout
                                    </a>
                                </>
                            ) : (
                                <div className="basket-rail__empty">
                                    <p>Wala pang laman ang basket mo.</p>
                                    <div className="basket-rail__suggestions">
                                        {featuredHighlights.map((item) => (
                                            <div className="basket-rail__suggestion" key={item.name}>
                                                <img src={item.image} alt={item.name} />
                                                <div>
                                                    <strong>{item.name}</strong>
                                                    <span>{formatCurrency(item.price)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </section>
        </>
    );
}
