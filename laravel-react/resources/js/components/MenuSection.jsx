import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/formatting';

export default function MenuSection({ section, items, compact = false }) {
    const { items: basketItems, addItem, updateQuantity } = useCart();

    function getItemQuantity(itemName) {
        return basketItems.find((item) => item.name === itemName)?.quantity || 0;
    }

    return (
        <section className={compact ? 'menu-group menu-group--compact' : 'menu-group'} id={section.slug}>
            {!compact ? (
                <div className="menu-group__header">
                    <div>
                        <p className="menu-group__eyebrow">{section.eyebrow}</p>
                        <h2 className="menu-group__title">{section.title}</h2>
                        <p className="section-heading__text">{section.subtitle}</p>
                    </div>

                    <div className="menu-group__summary">{items.length} putaheng available</div>
                </div>
            ) : null}

            <div className="menu-grid">
                {items.map((item) => (
                    <article className={`menu-card ${getItemQuantity(item.name) > 0 ? 'menu-card--active' : ''}`} key={item.name}>
                        <div className="menu-card__image-wrap">
                            <img src={item.image} alt={item.name} />
                            <span className="menu-card__badge">{item.badge}</span>
                            <span className="menu-card__availability">{item.available ? 'Handa' : 'Ubos na'}</span>
                            <span className="menu-card__price">{formatCurrency(item.price)}</span>
                        </div>

                        <div className="menu-card__body">
                            <div className="menu-card__header">
                                <h3 className="menu-card__title">{item.name}</h3>
                                <span className="menu-card__stock">{item.quantity} plato</span>
                            </div>
                            <p className="menu-card__text">{item.description}</p>
                            <button
                                className="menu-card__action"
                                type="button"
                                disabled={!item.available}
                                onClick={() => addItem(item)}
                            >
                                <span className="menu-card__action-icon" aria-hidden="true">
                                    {item.available ? '+' : '!'}
                                </span>
                                <span className="menu-card__action-label">{item.available ? 'Idagdag sa basket' : 'Hindi available'}</span>
                                <span className="menu-card__action-trail" aria-hidden="true">
                                    {item.available ? '>' : '-'}
                                </span>
                            </button>
                            {getItemQuantity(item.name) > 0 && (
                                <div className="menu-card__controls">
                                    <div className="quantity-stepper" aria-label={`Dami ng ${item.name}`}>
                                        <button type="button" onClick={() => updateQuantity(item.name, getItemQuantity(item.name) - 1)}>
                                            -
                                        </button>
                                        <span>{getItemQuantity(item.name)}</span>
                                        <button type="button" onClick={() => addItem(item)}>
                                            +
                                        </button>
                                    </div>
                                    <a className="menu-card__checkout-link" href="/checkout">
                                        Deretso sa checkout
                                    </a>
                                </div>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
