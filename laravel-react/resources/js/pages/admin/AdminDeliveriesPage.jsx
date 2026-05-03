import AdminWorkspaceHeader from '../../components/AdminWorkspaceHeader';
import { formatCurrency, formatDateTime, formatShortDate } from '../../lib/formatting';
import useAdminPanelData from '../../hooks/useAdminPanelData';
import { adminEmptyStateStyle, adminListStyle, adminPanelStyle, adminSectionHeadStyle, adminWorkspaceStyle } from './adminInlineStyles';

function getStatusTone(status) {
    const normalizedStatus = String(status || '').toLowerCase();

    if (normalizedStatus.includes('confirmed') || normalizedStatus.includes('review') || normalizedStatus.includes('preparing')) {
        return 'green';
    }

    if (normalizedStatus.includes('pending') || normalizedStatus.includes('awaiting') || normalizedStatus.includes('waiting')) {
        return 'gold';
    }

    return 'ink';
}

function getClaimedAtLabel(delivery) {
    if (!delivery?.claimedAt) {
        return 'Waiting for rider claim';
    }

    return formatDateTime(delivery.claimedAt);
}

function getDeliveredAtLabel(delivery) {
    if (!delivery?.deliveredAt) {
        return 'Not delivered yet';
    }

    return formatDateTime(delivery.deliveredAt);
}

export default function AdminDeliveriesPage() {
    const { adminSession, deliveries, warnings } = useAdminPanelData();

    if (!adminSession) {
        return (
            <section className="page-section">
                <div className="panel-card dashboard-guest">
                    <p className="eyebrow">Admin deliveries page</p>
                    <h1 className="panel-card__title">Sign in as admin first.</h1>
                    <p className="form-card__text">Deliveries and rider claim activity are now on their own admin page.</p>
                    <div className="page-hero__actions">
                        <a className="button-link" href="/admin/login">
                            Admin login
                        </a>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="page-section">
            <div className="admin-workspace" style={adminWorkspaceStyle}>
                <AdminWorkspaceHeader
                    eyebrow="Delivery board"
                    title="Delivery orders and rider claims."
                    text="Track real checkout orders, see which rider took the delivery, and monitor addresses, payment, and totals from one clean admin board."
                    actions={[
                        { href: '/admin', label: 'Overview' },
                        { href: '/admin/riders', label: 'Riders', variant: 'ghost' },
                    ]}
                    stats={[
                        { value: `${deliveries.length}`, label: 'Orders' },
                        { value: `${deliveries.filter((item) => item.assignedRider !== 'Unassigned').length}`, label: 'Claimed by rider' },
                        { value: `${deliveries.filter((item) => item.assignedRider === 'Unassigned').length}`, label: 'Waiting for rider' },
                        { value: `${deliveries.filter((item) => String(item.status).toLowerCase().includes('deliver')).length}`, label: 'Delivered' },
                    ]}
                />

                {warnings.length > 0 ? (
                    <div className="note-strip note-strip--soft">
                        <strong>Delivery data</strong>
                        <span>{warnings.join(' ')}</span>
                    </div>
                ) : null}

                <section className="admin-workspace__section" style={adminPanelStyle}>
                    <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                        <div>
                            <h2>Live delivery orders</h2>
                            <p>Orders placed from checkout appear here automatically. Riders take deliveries from the rider panel, and admin can monitor who claimed each order.</p>
                        </div>
                    </div>

                    <div className="admin-appointments" style={adminListStyle}>
                        {deliveries.length > 0 ? (
                            deliveries.map((delivery) => {
                                const hasClaimedRider = delivery.assignedRider && delivery.assignedRider !== 'Unassigned';

                                return (
                                    <article className="admin-appointment-card" key={delivery.key}>
                                        <div className="admin-appointment-card__top">
                                            <div>
                                                <p className="eyebrow">{delivery.orderMode}</p>
                                                <h3 className="admin-appointment-card__title">{delivery.orderCode}</h3>
                                            </div>
                                            <span className={`table-list__status table-list__status--${getStatusTone(delivery.status)}`}>{delivery.status}</span>
                                        </div>

                                        <div className="admin-appointment-card__meta">
                                            <span>{delivery.customerName}</span>
                                            <span>{delivery.email}</span>
                                            <span>{delivery.phone}</span>
                                        </div>

                                        <div className="admin-appointment-card__grid">
                                            <div className="admin-appointment-card__info">
                                                <span>Address</span>
                                                <strong>{delivery.address}</strong>
                                            </div>
                                            <div className="admin-appointment-card__info">
                                                <span>Payment</span>
                                                <strong>{delivery.paymentMethod}</strong>
                                            </div>
                                            <div className="admin-appointment-card__info">
                                                <span>Rider who took it</span>
                                                <strong>{hasClaimedRider ? delivery.assignedRider : 'Waiting for rider claim'}</strong>
                                            </div>
                                            <div className="admin-appointment-card__info">
                                                <span>Claimed at</span>
                                                <strong>{getClaimedAtLabel(delivery)}</strong>
                                            </div>
                                            <div className="admin-appointment-card__info">
                                                <span>Total</span>
                                                <strong>{formatCurrency(delivery.total)}</strong>
                                            </div>
                                            <div className="admin-appointment-card__info">
                                                <span>Delivered at</span>
                                                <strong>{getDeliveredAtLabel(delivery)}</strong>
                                            </div>
                                        </div>

                                        <p className="admin-appointment-card__notes">
                                            {delivery.itemCount} item(s) | Ordered {delivery.createdAt ? formatShortDate(delivery.createdAt) : 'No saved date'} | {delivery.notes}
                                        </p>

                                        <div className="admin-appointment-card__footer">
                                            <div className="admin-appointment-card__assignment admin-appointment-card__assignment--readonly">
                                                <span>Rider claim status</span>
                                                <strong>
                                                    {hasClaimedRider
                                                        ? `${delivery.assignedRider} took this delivery at ${getClaimedAtLabel(delivery)} for ${delivery.customerName}.`
                                                        : 'No rider has taken this delivery yet.'}
                                                </strong>
                                            </div>

                                            <a className="button-link--ghost" href="/rider">
                                                Open rider panel
                                            </a>
                                        </div>
                                    </article>
                                );
                            })
                        ) : (
                            <div className="admin-empty-state" style={adminEmptyStateStyle}>
                                <strong>No delivery orders yet</strong>
                                <span>Customer checkout orders in delivery mode will appear here for admin and riders. Once a rider takes a delivery from the rider panel, the claimed rider will appear here automatically.</span>
                                <div className="page-hero__actions">
                                    <a className="button-link" href="/admin/riders">
                                        Open riders
                                    </a>
                                    <a className="button-link--ghost" href="/admin">
                                        Back to overview
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </section>
    );
}
