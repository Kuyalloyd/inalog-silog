import AdminWorkspaceHeader from '../../components/AdminWorkspaceHeader';
import { formatDateTime } from '../../lib/formatting';
import useAdminPanelData from '../../hooks/useAdminPanelData';
import { adminCardGridStyle, adminEmptyStateStyle, adminPanelStyle, adminSectionHeadStyle, adminWorkspaceStyle } from './adminInlineStyles';

export default function AdminCustomersPage() {
    const { adminSession, customers } = useAdminPanelData();

    if (!adminSession) {
        return (
            <section className="page-section">
                <div className="panel-card dashboard-guest">
                    <p className="eyebrow">Admin customers page</p>
                    <h1 className="panel-card__title">Sign in as admin first.</h1>
                    <p className="form-card__text">Customer information is now on its own admin page.</p>
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
                    eyebrow="Customer records"
                    title="Customer activity and contact records."
                    text="See which customers have bookings, delivery orders, saved contact details, and active rider or staff assignments."
                    actions={[
                        { href: '/admin', label: 'Overview' },
                        { href: '/admin/riders', label: 'Riders', variant: 'ghost' },
                    ]}
                    stats={[
                        { value: `${customers.length}`, label: 'Customers' },
                        { value: `${customers.filter((item) => item.bookings > 0).length}`, label: 'With bookings' },
                        { value: `${customers.filter((item) => item.deliveries > 0).length}`, label: 'With deliveries' },
                        { value: `${customers.filter((item) => item.assignedRider && item.assignedRider !== 'Not assigned').length}`, label: 'Assigned' },
                    ]}
                />

                <section className="admin-workspace__section" style={adminPanelStyle}>
                    <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                        <div>
                            <h2>Customer directory</h2>
                            <p>Built from real bookings and delivery orders already saved in the system.</p>
                        </div>
                    </div>

                    <div className="admin-directory-grid" style={adminCardGridStyle}>
                        {customers.length > 0 ? (
                            customers.map((customer) => (
                                <article className="admin-directory-card" key={customer.key}>
                                    <p className="eyebrow">Customer record</p>
                                    <h3>{customer.name}</h3>
                                    <div className="admin-directory-card__list">
                                        <div>
                                            <span>Email</span>
                                            <strong>{customer.email}</strong>
                                        </div>
                                        <div>
                                            <span>Phone</span>
                                            <strong>{customer.phone}</strong>
                                        </div>
                                        <div>
                                            <span>Address or location</span>
                                            <strong>{customer.address}</strong>
                                        </div>
                                        <div>
                                            <span>Bookings</span>
                                            <strong>{customer.bookings}</strong>
                                        </div>
                                        <div>
                                            <span>Deliveries</span>
                                            <strong>{customer.deliveries}</strong>
                                        </div>
                                        <div>
                                            <span>Assigned rider or staff</span>
                                            <strong>{customer.assignedRider}</strong>
                                        </div>
                                        <div>
                                            <span>Latest order status</span>
                                            <strong>{customer.latestOrderStatus}</strong>
                                        </div>
                                        <div>
                                            <span>Latest order code</span>
                                            <strong>{customer.latestOrderCode}</strong>
                                        </div>
                                        <div>
                                            <span>Latest activity</span>
                                            <strong>
                                                {customer.latestActivityLabel}
                                                {customer.latestActivityAt ? ` | ${formatDateTime(customer.latestActivityAt)}` : ''}
                                            </strong>
                                        </div>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="admin-empty-state" style={adminEmptyStateStyle}>
                                <strong>No customer records yet</strong>
                                <span>Customer registrations, profile activity, and delivery orders will build this directory automatically as the app is used.</span>
                                <div className="page-hero__actions">
                                    <a className="button-link" href="/admin/deliveries">
                                        Open deliveries
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
