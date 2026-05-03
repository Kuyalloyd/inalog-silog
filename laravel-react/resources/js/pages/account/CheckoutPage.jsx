import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../lib/formatting';
import { logAdminActivity } from '../../lib/adminActivityLog';
import { DEFAULT_STORE_LOCATION, geocodeAddress, getCurrentPosition } from '../../lib/locationTracking';
import { saveActiveOrder, saveOrderHistoryEntry } from '../../lib/orderHistory';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

const paymentOptions = [
    {
        value: 'Cash on Delivery',
        label: 'Cash on Delivery',
        text: 'Magbayad pagdating ng rider o pag-release ng order.',
    },
    {
        value: 'GCash',
        label: 'GCash',
        text: 'Mabilis na mobile payment para sa delivery at pick-up.',
    },
    {
        value: 'Card on Pick-up',
        label: 'Card on Pick-up',
        text: 'Para sa mga gustong dumaan at magbayad sa store.',
    },
];

const DELIVERY_ESTIMATE_MINUTES = 15;
const PICKUP_ESTIMATE_MINUTES = 10;

function extractMissingColumnName(error) {
    const errorText = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ');
    const missingColumnMatch =
        errorText.match(/Could not find the '([^']+)' column/i) ||
        errorText.match(/column ['"]?([^'"\s]+)['"]?/i);

    return missingColumnMatch?.[1] || '';
}

async function insertCustomerOrderPayload(payload) {
    const nextPayload = { ...payload };

    while (Object.keys(nextPayload).length > 0) {
        const { error } = await supabase.from('customer_orders').insert(nextPayload);

        if (!error) {
            return nextPayload;
        }

        const missingColumnName = extractMissingColumnName(error);

        if (!missingColumnName || !(missingColumnName in nextPayload)) {
            throw error;
        }

        delete nextPayload[missingColumnName];
    }

    throw new Error('The customer order could not be saved because the order table is missing required fields.');
}

function buildOrderSnapshot({ itemCount, items, orderMode, grandTotal, formValues, deliveryAddress, customerLocation = null }) {
    const deliveryEstimateMinutes = orderMode === 'delivery' ? DELIVERY_ESTIMATE_MINUTES : PICKUP_ESTIMATE_MINUTES;

    return {
        id: `IS-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        mode: orderMode,
        status: 'Inihahanda',
        itemCount,
        total: grandTotal,
        eta: `${deliveryEstimateMinutes} min`,
        deliveryEstimateMinutes,
        customerName: formValues.fullName,
        email: formValues.email,
        phone: formValues.phone,
        address: deliveryAddress,
        paymentMethod: formValues.paymentMethod,
        notes: formValues.notes,
        assignedRider: '',
        riderName: orderMode === 'delivery' ? 'Waiting for rider' : 'Store Release Team',
        riderVehicle: orderMode === 'delivery' ? 'Waiting for vehicle' : 'Counter release',
        storeName: 'Inalog Silog Butuan',
        storeLocation: DEFAULT_STORE_LOCATION,
        customerLocation,
        items: items.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
    };
}

export default function CheckoutPage() {
    const { items, itemCount, subtotal, deliveryFee, serviceFee, grandTotal, etaText, orderMode, setOrderMode, updateQuantity, clearCart } = useCart();
    const [member, setMember] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [pendingOrder, setPendingOrder] = useState(null);
    const [completedOrder, setCompletedOrder] = useState(null);
    const [notice, setNotice] = useState('Punan ang contact, address, at payment details bago i-place ang order.');
    const [noticeTone, setNoticeTone] = useState('info');
    const [formValues, setFormValues] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        landmark: '',
        notes: '',
        paymentMethod: paymentOptions[0].value,
    });

    useEffect(() => {
        if (!supabase) {
            return undefined;
        }

        let isMounted = true;

        supabase.auth.getUser().then(({ data }) => {
            if (!isMounted || !data.user) {
                return;
            }

            const metadata = data.user.user_metadata ?? {};

            setMember(data.user);
            setFormValues((currentValues) => ({
                ...currentValues,
                fullName: currentValues.fullName || metadata.full_name || '',
                email: currentValues.email || data.user.email || '',
                phone: currentValues.phone || metadata.phone || data.user.phone || '',
                address:
                    currentValues.address ||
                    metadata.address ||
                    [metadata.district, metadata.region].filter(Boolean).join(', '),
            }));
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setMember(session?.user ?? null);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    function updateField(name, value) {
        setFormValues((currentValues) => ({
            ...currentValues,
            [name]: value,
        }));
    }

    function validateCheckout() {
        if (!items.length) {
            setNoticeTone('error');
            setNotice('Magdagdag muna ng pagkain sa basket bago mag-checkout.');
            return null;
        }

        if (!formValues.fullName || !formValues.email || !formValues.phone || !formValues.address) {
            setNoticeTone('error');
            setNotice('Kumpletuhin muna ang pangalan, email, phone, at address.');
            return null;
        }

        const deliveryAddress = [formValues.address, formValues.landmark].filter(Boolean).join(', ');

        if (!deliveryAddress) {
            setNoticeTone('error');
            setNotice('Ilagay ang tamang delivery address bago magpatuloy.');
            return null;
        }

        return buildOrderSnapshot({
            itemCount,
            items,
            orderMode,
            grandTotal,
            formValues,
            deliveryAddress,
        });
    }

    function handleSubmit(event) {
        event.preventDefault();

        const nextPendingOrder = validateCheckout();

        if (!nextPendingOrder) {
            return;
        }

        setPendingOrder(nextPendingOrder);
        setIsConfirming(true);
        setNoticeTone('info');
        setNotice('I-review ang confirmation card bago tuluyang i-place ang order.');
    }

    async function resolveCustomerLocation(order) {
        if (!order || order.mode !== 'delivery') {
            return null;
        }

        const liveLocation = await getCurrentPosition();

        if (liveLocation) {
            return liveLocation;
        }

        try {
            return await geocodeAddress(order.address);
        } catch {
            return null;
        }
    }

    async function confirmOrderPlacement() {
        if (!pendingOrder) {
            return;
        }

        if (!isSupabaseConfigured || !supabase) {
            setNoticeTone('error');
            setNotice('Hindi pa naka-set ang Supabase para makapag-save ng orders.');
            return;
        }

        setIsSubmitting(true);
        setNoticeTone('info');
        setNotice('Sinusumite na ang order mo...');

        try {
            const customerLocation = await resolveCustomerLocation(pendingOrder);
            const finalizedOrder = {
                ...pendingOrder,
                customerLocation,
                storeLocation: DEFAULT_STORE_LOCATION,
            };
            const payload = {
                order_code: pendingOrder.id,
                customer_name: formValues.fullName,
                email: formValues.email,
                phone: formValues.phone,
                delivery_address: pendingOrder.address,
                order_mode: pendingOrder.mode,
                status: pendingOrder.status,
                payment_method: pendingOrder.paymentMethod,
                item_count: pendingOrder.itemCount,
                notes: pendingOrder.notes,
                rider_name: pendingOrder.mode === 'delivery' ? '' : pendingOrder.riderName,
                rider_vehicle: pendingOrder.mode === 'delivery' ? '' : pendingOrder.riderVehicle,
                delivery_estimate_minutes: pendingOrder.deliveryEstimateMinutes,
                source_page: '/checkout',
                order_items: pendingOrder.items,
                total_amount: pendingOrder.total,
            };

            await insertCustomerOrderPayload(payload);

            saveOrderHistoryEntry(finalizedOrder);
            saveActiveOrder(finalizedOrder);
            logAdminActivity({
                type: 'Checkout',
                title: finalizedOrder.mode === 'delivery' ? 'Customer placed delivery order' : 'Customer placed pick-up order',
                detail: `${finalizedOrder.id} | ${formatCurrency(finalizedOrder.total)} | ${finalizedOrder.address}`,
                actor: finalizedOrder.customerName,
                tone: finalizedOrder.mode === 'delivery' ? 'gold' : 'ink',
                occurredAt: finalizedOrder.createdAt,
            });
            clearCart();
            setIsConfirming(false);
            setPendingOrder(null);
            setCompletedOrder(finalizedOrder);
            setNoticeTone('success');
            setNotice('Confirmed na ang order mo. Ready na ang success modal at tracking page mo.');
        } catch (error) {
            setNoticeTone('error');
            setNotice(error?.message || 'Nagkaroon ng problema sa pag-save ng order. Pakisubukang muli.');
        } finally {
            setIsSubmitting(false);
        }
    }

    function openCompletedOrderPage(targetPath) {
        setCompletedOrder(null);
        window.location.assign(targetPath);
    }

    if (!items.length && !completedOrder) {
        return (
            <section className="page-section">
                <div className="checkout-empty">
                    <div className="checkout-empty__card">
                        <p className="eyebrow">Walang laman ang basket</p>
                        <h1 className="section-heading__title">Pumili muna ng mga putahe bago mag-checkout.</h1>
                        <p className="section-heading__text">
                            Pag may laman na ang basket mo, dito lilitaw ang address form, confirmation step, at 15-minute delivery tracking.
                        </p>
                        <div className="page-hero__actions">
                            <a className="button-link" href="/menu">
                                Bumalik sa menu
                            </a>
                            <a className="button-link--ghost" href="/dashboard">
                                Aking dashboard
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const noticeClassName = [
        'form-card__notice',
        noticeTone === 'error' ? 'form-card__notice--error' : '',
        noticeTone === 'success' ? 'form-card__notice--success' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section className="page-section">
            {items.length > 0 ? (
                <div className="checkout-shell">
                    <div className="checkout-main">
                        <section className="checkout-banner">
                            <div>
                                <p className="eyebrow">Checkout</p>
                                <h1 className="checkout-banner__title">I-review, i-confirm, at i-track ang order mo.</h1>
                                <p className="checkout-banner__text">
                                    Punan ang contact details, piliin ang payment, at i-review ang basket mo. Pag na-confirm, diretso ka sa
                                    delivery tracker na may live route board at 15-minute ETA.
                                </p>
                            </div>

                            <div className="checkout-banner__stats">
                                <div>
                                    <strong>{itemCount}</strong>
                                    <span>Item</span>
                                </div>
                                <div>
                                    <strong>{etaText}</strong>
                                    <span>ETA</span>
                                </div>
                                <div>
                                    <strong>{member?.email ? 'Saved' : 'Guest'}</strong>
                                    <span>Account state</span>
                                </div>
                            </div>
                        </section>

                        <form className="checkout-card" onSubmit={handleSubmit}>
                            <div className="checkout-card__section">
                                <div className="checkout-card__heading">
                                    <div>
                                        <p className="dashboard-panel__eyebrow">Mode ng order</p>
                                        <h2 className="panel-card__title">Delivery o pick-up</h2>
                                    </div>
                                </div>

                                <div className="order-mode-toggle order-mode-toggle--wide">
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
                            </div>

                            <div className="checkout-card__section">
                                <div className="checkout-card__heading">
                                    <div>
                                        <p className="dashboard-panel__eyebrow">Contact details</p>
                                        <h2 className="panel-card__title">Kung saan at kanino ihahatid</h2>
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="form-field">
                                        <label htmlFor="checkout-fullName">Buong pangalan</label>
                                        <input
                                            id="checkout-fullName"
                                            type="text"
                                            value={formValues.fullName}
                                            onChange={(event) => updateField('fullName', event.target.value)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="checkout-email">Email</label>
                                        <input
                                            id="checkout-email"
                                            type="email"
                                            value={formValues.email}
                                            onChange={(event) => updateField('email', event.target.value)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="checkout-phone">Phone</label>
                                        <input
                                            id="checkout-phone"
                                            type="text"
                                            value={formValues.phone}
                                            onChange={(event) => updateField('phone', event.target.value)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="checkout-address">Address</label>
                                        <input
                                            id="checkout-address"
                                            type="text"
                                            value={formValues.address}
                                            onChange={(event) => updateField('address', event.target.value)}
                                            disabled={isSubmitting}
                                            placeholder="Street, barangay, city"
                                        />
                                    </div>
                                    <div className="form-field form-field--full">
                                        <label htmlFor="checkout-landmark">Landmark o dagdag na guide</label>
                                        <input
                                            id="checkout-landmark"
                                            type="text"
                                            value={formValues.landmark}
                                            onChange={(event) => updateField('landmark', event.target.value)}
                                            disabled={isSubmitting}
                                            placeholder="Malapit sa simbahan, katabi ng tindahan, atbp."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="checkout-card__section">
                                <div className="checkout-card__heading">
                                    <div>
                                        <p className="dashboard-panel__eyebrow">Payment</p>
                                        <h2 className="panel-card__title">Piliin ang gusto mong paraan ng bayad</h2>
                                    </div>
                                </div>

                                <div className="payment-grid">
                                    {paymentOptions.map((option) => (
                                        <label className={formValues.paymentMethod === option.value ? 'payment-card payment-card--active' : 'payment-card'} key={option.value}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value={option.value}
                                                checked={formValues.paymentMethod === option.value}
                                                onChange={(event) => updateField('paymentMethod', event.target.value)}
                                                disabled={isSubmitting}
                                            />
                                            <strong>{option.label}</strong>
                                            <span>{option.text}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="checkout-card__section">
                                <div className="checkout-card__heading">
                                    <div>
                                        <p className="dashboard-panel__eyebrow">Order notes</p>
                                        <h2 className="panel-card__title">Mga bilin sa kusina o rider</h2>
                                    </div>
                                </div>

                                <div className="form-field form-field--full">
                                    <label htmlFor="checkout-notes">Optional na notes</label>
                                    <textarea
                                        id="checkout-notes"
                                        value={formValues.notes}
                                        onChange={(event) => updateField('notes', event.target.value)}
                                        disabled={isSubmitting}
                                        placeholder="Less spicy, extra tissue, tawag muna pagdating, atbp."
                                    />
                                </div>
                            </div>

                            <div className="checkout-card__section">
                                <div className="checkout-card__heading">
                                    <div>
                                        <p className="dashboard-panel__eyebrow">Review items</p>
                                        <h2 className="panel-card__title">Ayusin ang dami bago mag-confirm</h2>
                                    </div>
                                </div>

                                <div className="checkout-item-list">
                                    {items.map((item) => (
                                        <div className="checkout-item" key={item.name}>
                                            <img src={item.image} alt={item.name} />
                                            <div>
                                                <strong>{item.name}</strong>
                                                <p>{item.description}</p>
                                                <span>{formatCurrency(item.price)}</span>
                                            </div>
                                            <div className="quantity-stepper quantity-stepper--light">
                                                <button type="button" disabled={isSubmitting} onClick={() => updateQuantity(item.name, item.quantity - 1)}>
                                                    -
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button type="button" disabled={isSubmitting} onClick={() => updateQuantity(item.name, item.quantity + 1)}>
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className={`button-link form-submit ${isSubmitting ? 'form-submit--loading' : ''}`} type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Pinoproseso ang order...' : 'Review and confirm order'}
                            </button>

                            <div className={noticeClassName}>{notice}</div>
                        </form>
                    </div>

                    <aside className="checkout-sidebar">
                        <div className="checkout-summary">
                            <div className="checkout-summary__header">
                                <div>
                                    <p className="dashboard-panel__eyebrow">Order summary</p>
                                    <h2 className="panel-card__title">Kabuuang babayaran</h2>
                                </div>
                                <span className="checkout-summary__eta">{etaText}</span>
                            </div>

                            <div className="checkout-summary__list">
                                {items.map((item) => (
                                    <div className="checkout-summary__row" key={item.name}>
                                        <span>
                                            {item.quantity} x {item.name}
                                        </span>
                                        <strong>{formatCurrency(item.quantity * item.price)}</strong>
                                    </div>
                                ))}
                            </div>

                            <div className="checkout-summary__totals">
                                <div className="checkout-summary__row">
                                    <span>Subtotal</span>
                                    <strong>{formatCurrency(subtotal)}</strong>
                                </div>
                                <div className="checkout-summary__row">
                                    <span>{orderMode === 'delivery' ? 'Delivery fee' : 'Pick-up fee'}</span>
                                    <strong>{formatCurrency(deliveryFee)}</strong>
                                </div>
                                <div className="checkout-summary__row">
                                    <span>Service fee</span>
                                    <strong>{formatCurrency(serviceFee)}</strong>
                                </div>
                                <div className="checkout-summary__row checkout-summary__row--grand">
                                    <span>Total</span>
                                    <strong>{formatCurrency(grandTotal)}</strong>
                                </div>
                            </div>

                            <div className="checkout-summary__footer">
                                <p>
                                    {orderMode === 'delivery'
                                        ? 'Kapag na-confirm mo ang order, lilitaw muna ang success modal bago ka lumipat sa live tracker.'
                                        : 'Kapag na-confirm mo ang order, lilitaw muna ang success modal bago ka lumipat sa release tracker.'}
                                </p>
                                <a className="button-link--ghost" href="/menu">
                                    Magdagdag pa ng pagkain
                                </a>
                            </div>
                        </div>
                    </aside>
                </div>
            ) : (
                <div className="checkout-empty">
                    <div className="checkout-empty__card checkout-empty__card--success-state">
                        <p className="eyebrow">Order placed</p>
                        <h1 className="section-heading__title">Na-save na ang order mo at handa na ang tracking page.</h1>
                        <p className="section-heading__text">Piliin ang susunod mong pupuntahan mula sa success modal.</p>
                    </div>
                </div>
            )}

            {isConfirming && pendingOrder && (
                <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-order-title">
                    <div className="confirm-card">
                        <div className="confirm-card__head">
                            <div>
                                <p className="dashboard-panel__eyebrow">Final confirmation</p>
                                <h2 id="confirm-order-title">I-confirm ang order bago ito i-submit.</h2>
                            </div>
                            <button
                                className="confirm-card__close"
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => {
                                    setIsConfirming(false);
                                    setPendingOrder(null);
                                }}
                            >
                                X
                            </button>
                        </div>

                        <div className="confirm-card__content">
                            <div className="confirm-card__summary">
                                <div>
                                    <span>Customer</span>
                                    <strong>{pendingOrder.customerName}</strong>
                                </div>
                                <div>
                                    <span>Address</span>
                                    <strong>{pendingOrder.address}</strong>
                                </div>
                                <div>
                                    <span>Payment</span>
                                    <strong>{pendingOrder.paymentMethod}</strong>
                                </div>
                                <div>
                                    <span>ETA</span>
                                    <strong>{pendingOrder.eta}</strong>
                                </div>
                            </div>

                            <div className="confirm-card__items">
                                {pendingOrder.items.map((item) => (
                                    <div className="confirm-card__item" key={item.name}>
                                        <span>
                                            {item.quantity} x {item.name}
                                        </span>
                                        <strong>{formatCurrency(item.price * item.quantity)}</strong>
                                    </div>
                                ))}
                            </div>

                            <div className="confirm-card__total">
                                <span>Total to confirm</span>
                                <strong>{formatCurrency(pendingOrder.total)}</strong>
                            </div>
                        </div>

                        <div className="confirm-card__actions">
                            <button
                                className="button-link--ghost"
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => {
                                    setIsConfirming(false);
                                    setPendingOrder(null);
                                }}
                            >
                                Back to checkout
                            </button>
                            <button className={`button-link ${isSubmitting ? 'form-submit form-submit--loading' : ''}`} type="button" disabled={isSubmitting} onClick={confirmOrderPlacement}>
                                {isSubmitting ? 'Confirming order...' : 'Confirm and place order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {completedOrder && (
                <div className="confirm-overlay confirm-overlay--success" role="dialog" aria-modal="true" aria-labelledby="checkout-success-title">
                    <div className="confirm-card confirm-card--success">
                        <div className="confirm-card__success-top">
                            <span className="confirm-card__success-pill">Checkout successful</span>
                            <h2 id="checkout-success-title">Na-place na ang order mo.</h2>
                            <p>Naipasa na sa kitchen ang order at handa na ang live tracking board para sa susunod mong screen.</p>
                        </div>

                        <div className="confirm-card__success-grid">
                            <div>
                                <span>Order code</span>
                                <strong>{completedOrder.id}</strong>
                            </div>
                            <div>
                                <span>ETA</span>
                                <strong>{completedOrder.eta}</strong>
                            </div>
                            <div>
                                <span>Rider / team</span>
                                <strong>{completedOrder.riderName}</strong>
                            </div>
                            <div>
                                <span>Total</span>
                                <strong>{formatCurrency(completedOrder.total)}</strong>
                            </div>
                        </div>

                        <div className="confirm-card__items">
                            {completedOrder.items.map((item) => (
                                <div className="confirm-card__item" key={item.name}>
                                    <span>
                                        {item.quantity} x {item.name}
                                    </span>
                                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="confirm-card__total confirm-card__total--success">
                            <span>Delivery address</span>
                            <strong>{completedOrder.address}</strong>
                        </div>

                        <div className="confirm-card__actions">
                            <button className="button-link--ghost" type="button" onClick={() => openCompletedOrderPage('/dashboard')}>
                                Back to dashboard
                            </button>
                            <button className="button-link" type="button" onClick={() => openCompletedOrderPage('/track-order')}>
                                Track my order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
