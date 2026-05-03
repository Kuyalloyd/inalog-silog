import { useCart } from '../../context/CartContext';
import MenuSection from '../../components/MenuSection';
import PageHero from '../../components/PageHero';
import { formatCurrency } from '../../lib/formatting';
import { getFeaturedMenuItems, getMenuItemsByCategory, menuSections, menuItems } from '../../data/menuData';

export default function MenuPage() {
    const { items, itemCount, subtotal, grandTotal, deliveryFee, etaText, orderMode, removeItem, setOrderMode } = useCart();
    const showcaseImages = getFeaturedMenuItems()
        .slice(0, 3)
        .map((item) => item.image);
    const featuredHighlights = getFeaturedMenuItems().slice(0, 3);

    return (
        <>
            <PageHero
                eyebrow="Kusina ng Inalog Silog"
                title="Mas maraming putahe, mas buhay na plato, at menu na swak sa panlasang Pinoy."
                text="Tuklasin ang silog favorites, seafood plates, sharing trays, at comfort dishes na bagay sa simpleng cravings at espesyal na handaan."
                actions={[
                    { href: '/checkout', label: itemCount > 0 ? 'Buksan ang checkout' : 'Silipin ang checkout' },
                    { href: '/contact', label: 'Magtanong tungkol sa handaan', variant: 'ghost' },
                ]}
                stats={[
                    { value: `${menuItems.length}+`, label: 'Putaheng available' },
                    { value: `${menuSections.length}`, label: 'Seksyon ng menu' },
                    { value: 'PHP', label: 'Presyong pang-local' },
                ]}
                images={showcaseImages}
            />

            <section className="page-section">
                <div className="order-experience">
                    <div className="order-experience__copy">
                        <p className="eyebrow">Mas app-style na order flow</p>
                        <h2 className="section-heading__title">Piliin ang mode, dagdagan ang basket, at dumiretso sa checkout.</h2>
                        <p className="section-heading__text">
                            Gaya ng delivery apps, puwede mong bantayan ang total, ETA, at kasalukuyang basket habang namimili ka ng putahe.
                        </p>
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
                                <span>Nasa basket</span>
                            </div>
                            <div>
                                <strong>{etaText}</strong>
                                <span>Tinatayang dating</span>
                            </div>
                            <div>
                                <strong>{formatCurrency(grandTotal || subtotal)}</strong>
                                <span>Kabuuang bayad</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="menu-market">
                    <div className="menu-market__main">
                        <nav className="menu-nav" aria-label="Mga seksyon ng menu">
                            {menuSections.map((section) => (
                                <a className="menu-nav__link" href={`#${section.slug}`} key={section.key}>
                                    <span>{section.navLabel}</span>
                                    <span className="menu-nav__count">{getMenuItemsByCategory(section.key).length}</span>
                                </a>
                            ))}
                        </nav>

                        {menuSections.map((section) => (
                            <MenuSection key={section.key} section={section} items={getMenuItemsByCategory(section.key)} />
                        ))}
                    </div>

                    <aside className="basket-rail">
                        <div className="basket-rail__card">
                            <div className="basket-rail__header">
                                <div>
                                    <p className="basket-rail__eyebrow">Basket mo</p>
                                    <h3>Live na kabuuan habang namimili</h3>
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
                                            <span>Kabuuan</span>
                                            <strong>{formatCurrency(grandTotal)}</strong>
                                        </div>
                                    </div>

                                    <a className="button-link basket-rail__cta" href="/checkout">
                                        Ituloy ang checkout
                                    </a>
                                </>
                            ) : (
                                <div className="basket-rail__empty">
                                    <p>Wala pang laman ang basket mo. Pumili ng putahe at makikita mo agad dito ang kabuuan.</p>
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
