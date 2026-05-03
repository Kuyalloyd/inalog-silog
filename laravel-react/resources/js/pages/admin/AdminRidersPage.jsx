import AdminWorkspaceHeader from '../../components/AdminWorkspaceHeader';
import { formatDateTime } from '../../lib/formatting';
import useAdminPanelData from '../../hooks/useAdminPanelData';
import { adminCardGridStyle, adminEmptyStateStyle, adminPanelStyle, adminSectionHeadStyle, adminWorkspaceStyle } from './adminInlineStyles';

export default function AdminRidersPage() {
    const { adminSession, riders, activities } = useAdminPanelData();
    const riderActivities = activities.filter((activity) => String(activity.type || '').toLowerCase() === 'rider').slice(0, 10);

    if (!adminSession) {
        return (
            <section className="page-section">
                <div className="panel-card dashboard-guest">
                    <p className="eyebrow">Admin riders page</p>
                    <h1 className="panel-card__title">Sign in as admin first.</h1>
                    <p className="form-card__text">Rider information is now on its own admin page.</p>
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
                    eyebrow="Rider records"
                    title="Rider roster, shifts, and workload."
                    text="Check which riders are on shift, what zone they handle, and how many deliveries or bookings are currently assigned to them."
                    actions={[
                        { href: '/admin', label: 'Overview' },
                        { href: '/admin/deliveries', label: 'Deliveries', variant: 'ghost' },
                    ]}
                    stats={[
                        { value: `${riders.length}`, label: 'Riders' },
                        { value: `${riders.filter((item) => item.status === 'On shift').length}`, label: 'On shift' },
                        { value: `${riders.reduce((sum, rider) => sum + rider.assignedDeliveries, 0)}`, label: 'Deliveries' },
                        { value: `${riders.reduce((sum, rider) => sum + rider.assignedBookings, 0)}`, label: 'Bookings' },
                    ]}
                />

                <section className="admin-workspace__section" style={adminPanelStyle}>
                    <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                        <div>
                            <h2>Rider directory</h2>
                            <p>Live rider sessions and assigned workload are combined into one clear operations list.</p>
                        </div>
                    </div>

                    <div className="admin-directory-grid" style={adminCardGridStyle}>
                        {riders.length > 0 ? (
                            riders.map((rider) => (
                                <article className="admin-directory-card" key={rider.name}>
                                    <p className="eyebrow">Rider record</p>
                                    <h3>{rider.name}</h3>
                                    <div className="admin-directory-card__list">
                                        <div>
                                            <span>Code</span>
                                            <strong>{rider.code}</strong>
                                        </div>
                                        <div>
                                            <span>Vehicle</span>
                                            <strong>{rider.vehicle}</strong>
                                        </div>
                                        <div>
                                            <span>Zone</span>
                                            <strong>{rider.zone}</strong>
                                        </div>
                                        <div>
                                            <span>Contact</span>
                                            <strong>{rider.phone}</strong>
                                        </div>
                                        <div>
                                            <span>Status</span>
                                            <strong>{rider.status}</strong>
                                        </div>
                                        <div>
                                            <span>Assigned deliveries</span>
                                            <strong>{rider.assignedDeliveries}</strong>
                                        </div>
                                        <div>
                                            <span>Assigned bookings</span>
                                            <strong>{rider.assignedBookings}</strong>
                                        </div>
                                        <div>
                                            <span>Current customer</span>
                                            <strong>{rider.currentCustomer}</strong>
                                        </div>
                                        <div>
                                            <span>Last claimed</span>
                                            <strong>{rider.lastClaimedAt ? formatDateTime(rider.lastClaimedAt) : 'No claim yet'}</strong>
                                        </div>
                                        <div>
                                            <span>Last delivered</span>
                                            <strong>{rider.lastDeliveredAt ? formatDateTime(rider.lastDeliveredAt) : 'No delivery yet'}</strong>
                                        </div>
                                        <div>
                                            <span>Last order code</span>
                                            <strong>{rider.lastOrderCode}</strong>
                                        </div>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="admin-empty-state" style={adminEmptyStateStyle}>
                                <strong>No rider records yet</strong>
                                <span>Registered riders, rider claims, and completed deliveries will appear here automatically as soon as those records are saved in the system.</span>
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

                <section className="admin-workspace__section" style={adminPanelStyle}>
                    <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                        <div>
                            <h2>Recent rider activity</h2>
                            <p>See when riders signed in, took orders, and completed deliveries.</p>
                        </div>
                    </div>

                    <div className="admin-directory-grid" style={adminCardGridStyle}>
                        {riderActivities.length > 0 ? (
                            riderActivities.map((activity) => (
                                <article className="admin-directory-card" key={activity.key}>
                                    <p className="eyebrow">{activity.type}</p>
                                    <h3>{activity.actor}</h3>
                                    <div className="admin-directory-card__list">
                                        <div>
                                            <span>Activity</span>
                                            <strong>{activity.title}</strong>
                                        </div>
                                        <div>
                                            <span>Details</span>
                                            <strong>{activity.detail}</strong>
                                        </div>
                                        <div>
                                            <span>Time</span>
                                            <strong>{formatDateTime(activity.occurredAt)}</strong>
                                        </div>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="admin-empty-state" style={adminEmptyStateStyle}>
                                <strong>No rider activity yet</strong>
                                <span>Rider sign-ins, claims, and completed deliveries will appear here automatically.</span>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </section>
    );
}
