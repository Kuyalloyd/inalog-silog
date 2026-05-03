import useCustomerPanelData from '../../hooks/useCustomerPanelData';
import { formatCurrency, formatShortDate } from '../../lib/formatting';

const quickActions = [
    { title: 'Food', meta: 'Browse', href: '/dashboard/menu' },
    { title: 'Orders', meta: 'Track', href: '/dashboard/orders' },
    { title: 'Favorites', meta: 'Reorder', href: '/dashboard/favorites' },
    { title: 'Profile', meta: 'Manage', href: '/dashboard/account' },
];

export default function DashboardPage() {
    const {
        member,
        firstName,
        itemCount,
        recentOrders,
        profileProgress,
        etaText,
        grandTotal,
        savedRegion,
        savedDistrict,
        latestOrder,
        latestOrderItems,
        savedAddress,
    } = useCustomerPanelData();
    const showLoginPanel =
        typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('entry') === 'login';

    if (!member) {
        return (
            <section className="page-section">
                <div className="panel-card dashboard-guest">
                    <p className="eyebrow">Login muna</p>
                    <h1 className="panel-card__title">Mag-sign in para makita ang customer panel mo.</h1>
                    <p className="form-card__text">Open your customer panel.</p>
                    <div className="page-hero__actions">
                        <a className="button-link" href="/login">
                            Mag-login
                        </a>
                        <a className="button-link--ghost" href="/register">
                            Gumawa ng account
                        </a>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="page-section">
            <div className="customer-hub">
                {showLoginPanel ? (
                    <div className="note-strip note-strip--soft">
                        <strong>Signed in</strong>
                        <span>{member.email}</span>
                    </div>
                ) : null}

                <section className="customer-hub__hero">
                    <div className="customer-hub__main">
                        <p className="customer-hub__eyebrow">Customer app</p>
                        <h1>Hi, {firstName}.</h1>
                        <p>Order fast, track live, and keep delivery details ready.</p>

                        <div className="customer-hub__chips">
                            <span>{savedDistrict}</span>
                            <span>{savedRegion}</span>
                            <span>Member since {formatShortDate(member.created_at)}</span>
                        </div>

                        <div className="customer-hub__actions">
                            <a className="button-link" href="/dashboard/menu">
                                Order now
                            </a>
                            <a className="button-link--ghost" href="/dashboard/orders">
                                Track order
                            </a>
                            <a className="button-link--ghost" href="/dashboard/account">
                                Edit profile
                            </a>
                        </div>
                    </div>

                    <aside className="customer-hub__spotlight">
                        <div className="customer-hub__spotlight-card customer-hub__spotlight-card--accent">
                            <span>Deliver to</span>
                            <strong>{savedAddress}</strong>
                            <p>{latestOrder ? `Live order: ${latestOrder.id}` : 'No active order yet'}</p>
                        </div>
                        <div className="customer-hub__spotlight-grid">
                            <div>
                                <strong>{itemCount}</strong>
                                <span>Basket</span>
                            </div>
                            <div>
                                <strong>{recentOrders.length}</strong>
                                <span>Orders</span>
                            </div>
                            <div>
                                <strong>{profileProgress}%</strong>
                                <span>Profile</span>
                            </div>
                            <div>
                                <strong>{etaText}</strong>
                                <span>ETA</span>
                            </div>
                        </div>
                    </aside>
                </section>

                <div className="customer-hub__grid">
                    <section className="customer-hub__lane customer-hub__lane--wide">
                        <article className="customer-hub__card customer-hub__card--order">
                            <div className="customer-hub__card-head">
                                <div>
                                    <p>Live order</p>
                                    <h2>{latestOrder?.status || 'Ready for checkout'}</h2>
                                </div>
                                <span>{latestOrder?.id || 'No active code'}</span>
                            </div>

                            <div className="customer-hub__order-meta">
                                <div>
                                    <span>Amount</span>
                                    <strong>{latestOrder ? formatCurrency(latestOrder.total) : formatCurrency(grandTotal)}</strong>
                                </div>
                                <div>
                                    <span>Mode</span>
                                    <strong>{latestOrder?.mode === 'pickup' ? 'Pick-up' : 'Delivery'}</strong>
                                </div>
                                <div>
                                    <span>Assigned lane</span>
                                    <strong>{latestOrder?.riderName || 'Store team'}</strong>
                                </div>
                            </div>

                            {latestOrderItems.length > 0 ? (
                                <div className="customer-hub__order-items">
                                    {latestOrderItems.map((item) => (
                                        <div className="customer-hub__order-item" key={item.name}>
                                            <strong>{item.name}</strong>
                                            <span>
                                                {(item.quantity || 1)} x {formatCurrency(item.price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="dashboard-empty dashboard-empty--soft">
                                    <strong>Wala pang active order</strong>
                                    <span>Open the food tab and add your first meal.</span>
                                </div>
                            )}
                        </article>

                        <article className="customer-hub__card">
                            <div className="customer-hub__card-head">
                                <div>
                                    <p>Quick links</p>
                                    <h2>Open what you need</h2>
                                </div>
                            </div>

                            <div className="customer-hub__quick-grid">
                                {quickActions.map((action) => (
                                    <a className="customer-hub__quick-card" href={action.href} key={action.title}>
                                        <span>{action.meta}</span>
                                        <strong>{action.title}</strong>
                                    </a>
                                ))}
                            </div>
                        </article>
                    </section>

                    <aside className="customer-hub__lane">
                        <article className="customer-hub__card customer-hub__card--profile">
                            <div className="customer-hub__profile">
                                <div className="customer-hub__avatar">{firstName.slice(0, 1).toUpperCase()}</div>
                                <div>
                                    <p>Signed in as</p>
                                    <strong>{firstName}</strong>
                                    <span>{member.email}</span>
                                </div>
                            </div>

                            <div className="customer-hub__profile-list">
                                <div>
                                    <span>Saved city</span>
                                    <strong>{savedDistrict}</strong>
                                </div>
                                <div>
                                    <span>Saved region</span>
                                    <strong>{savedRegion}</strong>
                                </div>
                                <div>
                                    <span>Basket total</span>
                                    <strong>{formatCurrency(grandTotal)}</strong>
                                </div>
                                <div>
                                    <span>Next move</span>
                                    <strong>{itemCount > 0 ? 'Checkout' : 'Browse food'}</strong>
                                </div>
                            </div>
                        </article>

                        <article className="customer-hub__card customer-hub__card--checkout">
                            <div className="customer-hub__card-head">
                                <div>
                                    <p>Fast checkout</p>
                                    <h2>Ready when you are</h2>
                                </div>
                            </div>
                            <p className="customer-hub__card-copy">Saved address and contact details stay ready for repeat orders.</p>
                            <div className="customer-hub__checkout-actions">
                                <a className="button-link" href="/checkout">
                                    Continue checkout
                                </a>
                                <a className="button-link--ghost" href="/track-order">
                                    Open tracker
                                </a>
                            </div>
                        </article>
                    </aside>
                </div>
            </div>
        </section>
    );
}
