import { useState } from 'react';
import AdminWorkspaceHeader from '../../components/AdminWorkspaceHeader';
import PanelSearchBar from '../../components/PanelSearchBar';
import useAdminPanelData from '../../hooks/useAdminPanelData';
import { adminCardGridStyle, adminEmptyStateStyle, adminListStyle, adminPanelStyle, adminSectionHeadStyle, adminTwoColumnStyle, adminWorkspaceStyle } from './adminInlineStyles';

const quickLinks = [
    {
        title: 'Bookings board',
        text: 'See reservations, events, and assigned staff.',
        href: '/admin/appointments',
    },
    {
        title: 'Delivery board',
        text: 'Monitor orders and assigned riders.',
        href: '/admin/deliveries',
    },
    {
        title: 'Customer records',
        text: 'Review customer details and account activity.',
        href: '/admin/customers',
    },
    {
        title: 'Rider records',
        text: 'Review rider status, zones, and assignments.',
        href: '/admin/riders',
    },
];

const adminPulseCardStyle = {
    display: 'grid',
    gap: '0.4rem',
    padding: '1rem 1.05rem',
    borderRadius: '20px',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    background: '#f8fafc',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.7)',
};

const adminInsightItemStyle = {
    display: 'grid',
    gap: '0.45rem',
    padding: '1rem',
    borderRadius: '18px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: '#f8fafc',
};

const adminBadgeRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.45rem',
};

const adminBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '32px',
    padding: '0.35rem 0.75rem',
    borderRadius: '999px',
    border: '1px solid rgba(148, 163, 184, 0.24)',
    background: '#ffffff',
    color: '#475569',
    fontSize: '0.78rem',
    fontWeight: 700,
};

function buildSearchText(value) {
    if (value === null || value === undefined) {
        return '';
    }

    if (Array.isArray(value)) {
        return value.map((entry) => buildSearchText(entry)).join(' ');
    }

    if (typeof value === 'object') {
        return Object.values(value)
            .map((entry) => buildSearchText(entry))
            .join(' ');
    }

    return String(value);
}

function matchesAdminRecord(record, query) {
    return buildSearchText(record).toLowerCase().includes(query);
}

function formatActivityDate(value) {
    const activityDate = new Date(value || '');

    return Number.isNaN(activityDate.getTime()) ? 'Recent activity' : activityDate.toLocaleString();
}

function getActivityType(activity) {
    return String(activity?.type || '').toLowerCase();
}

function getActivityTitle(activity) {
    return String(activity?.title || '').toLowerCase();
}

function extractActivityKey(activity) {
    const detailMatch = String(activity?.detail || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

    if (detailMatch?.[0]) {
        return detailMatch[0].toLowerCase();
    }

    return String(activity?.actor || activity?.key || '')
        .trim()
        .toLowerCase();
}

function countUniqueActivities(activities, type, keyword) {
    return new Set(
        activities
            .filter((activity) => getActivityType(activity) === type && getActivityTitle(activity).includes(keyword))
            .map((activity) => extractActivityKey(activity))
            .filter(Boolean),
    ).size;
}

function sortCustomerHighlights(customers) {
    return [...customers]
        .sort((left, right) => right.bookings + right.deliveries - (left.bookings + left.deliveries) || left.name.localeCompare(right.name))
        .slice(0, 4);
}

function sortRiderHighlights(riders) {
    function getScore(rider) {
        return (rider.status === 'On shift' ? 100 : rider.status === 'Assigned' ? 50 : 0) + rider.assignedDeliveries * 10 + rider.assignedBookings * 6;
    }

    return [...riders].sort((left, right) => getScore(right) - getScore(left) || left.name.localeCompare(right.name)).slice(0, 4);
}

export default function AdminPage() {
    const { adminSession, appointments, deliveries, customers, riders, appointmentWarnings, warnings, isLoading, errorMessage, activities, loadAdminPanel } =
        useAdminPanelData();
    const [adminSearch, setAdminSearch] = useState('');
    const normalizedAdminSearch = adminSearch.trim().toLowerCase();
    const guestBookingCount = appointments.filter((record) => record.accountType === 'guest').length;
    const filteredAppointments = normalizedAdminSearch ? appointments.filter((record) => matchesAdminRecord(record, normalizedAdminSearch)) : appointments;
    const filteredDeliveries = normalizedAdminSearch ? deliveries.filter((record) => matchesAdminRecord(record, normalizedAdminSearch)) : deliveries;
    const filteredCustomers = normalizedAdminSearch ? customers.filter((record) => matchesAdminRecord(record, normalizedAdminSearch)) : customers;
    const filteredRiders = normalizedAdminSearch ? riders.filter((record) => matchesAdminRecord(record, normalizedAdminSearch)) : riders;
    const adminSearchResults = normalizedAdminSearch
        ? [
              ...filteredAppointments.slice(0, 2).map((record) => ({
                  group: 'Booking',
                  title: record.customerName || record.type || 'Booking record',
                  meta: [record.type, record.locationLabel, record.assignedTo].filter(Boolean).join(' | '),
              })),
              ...filteredDeliveries.slice(0, 2).map((record) => ({
                  group: 'Delivery',
                  title: record.customerName || record.orderCode || 'Delivery record',
                  meta: [record.orderCode, record.address, record.assignedRider].filter(Boolean).join(' | '),
              })),
              ...filteredCustomers.slice(0, 2).map((record) => ({
                  group: 'Customer',
                  title: record.name || 'Customer record',
                  meta: [record.email, record.phone, record.address].filter(Boolean).join(' | '),
              })),
              ...filteredRiders.slice(0, 2).map((record) => ({
                  group: 'Rider',
                  title: record.name || 'Rider record',
                  meta: [record.code, record.vehicle, record.zone].filter(Boolean).join(' | '),
              })),
          ]
        : [];
    const customerActivities = activities.filter((activity) => getActivityType(activity) === 'customer').slice(0, 5);
    const riderActivities = activities.filter((activity) => getActivityType(activity) === 'rider').slice(0, 5);
    const registeredCustomerCount = countUniqueActivities(activities, 'customer', 'account created');
    const registeredRiderCount = countUniqueActivities(activities, 'rider', 'account created');
    const customerSignInCount = activities.filter((activity) => getActivityType(activity) === 'customer' && getActivityTitle(activity).includes('signed in')).length;
    const ridersOnShiftCount = riders.filter((item) => item.status === 'On shift').length;
    const assignedBookingsCount = appointments.filter((item) => item.assignedTo !== 'Unassigned').length;
    const assignedDeliveriesCount = deliveries.filter((item) => item.assignedRider !== 'Unassigned').length;
    const customerHighlights = sortCustomerHighlights(customers);
    const riderHighlights = sortRiderHighlights(riders);
    const showLoginPanel = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('entry') === 'login';
    const adminDataNotes = [...appointmentWarnings, ...warnings];

    if (!adminSession) {
        return (
            <section className="page-section">
                <div className="admin-command admin-command--guest">
                    <p className="admin-command__eyebrow">Admin access required</p>
                    <h1>Sign in to open the operations command center.</h1>
                    <p>The admin area is separate from customer and rider panels, with pages for bookings, deliveries, customer records, and riders.</p>
                    <div className="page-hero__actions">
                        <a className="button-link" href="/admin/login">
                            Admin login
                        </a>
                        <a className="button-link--ghost" href="/">
                            Back to website
                        </a>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="page-section">
            <div className="admin-workspace" style={adminWorkspaceStyle}>
                {showLoginPanel ? (
                    <div className="note-strip note-strip--soft">
                        <strong>Admin session active</strong>
                        <span>{adminSession.email}</span>
                    </div>
                ) : null}

                <AdminWorkspaceHeader
                    eyebrow="Admin activity center"
                    title="Track website activity, registered customers, and rider operations from one admin workspace."
                    text="This overview keeps customer signups, rider movement, bookings, rider-claimed deliveries, and live admin activity easy to scan from the top navbar."
                    actions={[
                        { href: '/admin/customers', label: 'Customers' },
                        { href: '/admin/riders', label: 'Riders', variant: 'ghost' },
                        { label: isLoading ? 'Refreshing...' : 'Refresh', variant: 'ghost', onClick: loadAdminPanel, disabled: isLoading },
                    ]}
                    stats={[
                        { value: `${registeredCustomerCount}`, label: 'Customer signups' },
                        { value: `${registeredRiderCount}`, label: 'Rider signups' },
                        { value: `${ridersOnShiftCount}`, label: 'On shift' },
                        { value: `${activities.length}`, label: 'Activity events' },
                    ]}
                />

                {appointments.length === 0 && deliveries.length === 0 && customers.length === 0 && riders.length === 0 && activities.length === 0 ? (
                    <div className="note-strip note-strip--soft">
                        <strong>No admin records yet</strong>
                        <span>Real bookings, delivery orders, customer activity, rider sessions, and admin actions will appear here as the system starts being used.</span>
                    </div>
                ) : null}

                {adminDataNotes.length > 0 ? (
                    <div className="note-strip note-strip--soft">
                        <strong>Admin data note</strong>
                        <span>{adminDataNotes.join(' ')}</span>
                    </div>
                ) : null}

                {errorMessage ? (
                    <div className="note-strip note-strip--soft">
                        <strong>Loading issue</strong>
                        <span>{errorMessage}</span>
                    </div>
                ) : null}

                {guestBookingCount > 0 ? (
                    <div className="note-strip note-strip--soft">
                        <strong>Booking source note</strong>
                        <span>
                            {guestBookingCount} booking record(s) came from the public booking form without a linked member account, so those names may not appear in the
                            registered customer list.
                        </span>
                    </div>
                ) : null}

                <section className="admin-workspace__section" style={adminPanelStyle}>
                    <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                        <div>
                            <h2>Website activity pulse</h2>
                            <p>Quick numbers for registered customers, rider movement, assignments, and overall website activity.</p>
                        </div>
                    </div>

                    <div className="admin-command__pulse-grid" style={adminCardGridStyle}>
                        <article style={adminPulseCardStyle}>
                            <span>Registered customers</span>
                            <strong>{registeredCustomerCount}</strong>
                            <p>{customers.length} customer record(s) are visible in the admin directory.</p>
                        </article>
                        <article style={adminPulseCardStyle}>
                            <span>Customer sign-ins</span>
                            <strong>{customerSignInCount}</strong>
                            <p>Recent member sign-ins recorded from the website account area.</p>
                        </article>
                        <article style={adminPulseCardStyle}>
                            <span>Registered riders</span>
                            <strong>{registeredRiderCount}</strong>
                            <p>Rider account creations tracked by the admin activity log.</p>
                        </article>
                        <article style={adminPulseCardStyle}>
                            <span>Riders on shift</span>
                            <strong>{ridersOnShiftCount}</strong>
                            <p>{riderActivities.length} recent rider event(s) are visible right now.</p>
                        </article>
                        <article style={adminPulseCardStyle}>
                            <span>Rider-claimed deliveries</span>
                            <strong>{assignedDeliveriesCount}</strong>
                            <p>{deliveries.length} delivery order(s) currently tracked by admin.</p>
                        </article>
                        <article style={adminPulseCardStyle}>
                            <span>Assigned bookings</span>
                            <strong>{assignedBookingsCount}</strong>
                            <p>{appointments.length} booking request(s) currently visible in the admin board.</p>
                        </article>
                    </div>
                </section>

                <div className="admin-command__grid" style={adminTwoColumnStyle}>
                    <section className="admin-workspace__section" style={adminPanelStyle}>
                        <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                            <div>
                                <h2>Registered customer activity</h2>
                                <p>See recent customer account actions and the busiest customer records in one place.</p>
                            </div>
                            <a className="button-link--ghost" href="/admin/customers">
                                Open customers
                            </a>
                        </div>

                        <div style={adminListStyle}>
                            {customerActivities.length > 0 ? (
                                customerActivities.map((activity) => (
                                    <article key={activity.key} className={`admin-command__activity-item admin-command__activity-item--${activity.tone}`} style={adminInsightItemStyle}>
                                        <div className="admin-command__activity-top">
                                            <span>{activity.type}</span>
                                            <strong>{activity.title}</strong>
                                        </div>
                                        <p>{activity.detail}</p>
                                        <div className="admin-command__activity-meta">
                                            <span>{activity.actor}</span>
                                            <span>{formatActivityDate(activity.occurredAt)}</span>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="dashboard-empty dashboard-empty--soft" style={adminEmptyStateStyle}>
                                    <strong>No customer activity yet</strong>
                                    <span>Customer registrations, sign-ins, and profile updates will show here.</span>
                                </div>
                            )}
                        </div>

                        <div style={adminListStyle}>
                            {customerHighlights.map((customer) => (
                                <article key={customer.key} style={adminInsightItemStyle}>
                                    <strong>{customer.name}</strong>
                                    <p>{customer.email}</p>
                                    <div style={adminBadgeRowStyle}>
                                        <span style={adminBadgeStyle}>{customer.bookings} booking(s)</span>
                                        <span style={adminBadgeStyle}>{customer.deliveries} delivery(ies)</span>
                                        <span style={adminBadgeStyle}>{customer.assignedRider}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="admin-workspace__section" style={adminPanelStyle}>
                        <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                            <div>
                                <h2>Rider activity and roster</h2>
                                <p>Follow rider sign-ins, live shift status, and the riders carrying active assignments.</p>
                            </div>
                            <a className="button-link--ghost" href="/admin/riders">
                                Open riders
                            </a>
                        </div>

                        <div style={adminListStyle}>
                            {riderActivities.length > 0 ? (
                                riderActivities.map((activity) => (
                                    <article key={activity.key} className={`admin-command__activity-item admin-command__activity-item--${activity.tone}`} style={adminInsightItemStyle}>
                                        <div className="admin-command__activity-top">
                                            <span>{activity.type}</span>
                                            <strong>{activity.title}</strong>
                                        </div>
                                        <p>{activity.detail}</p>
                                        <div className="admin-command__activity-meta">
                                            <span>{activity.actor}</span>
                                            <span>{formatActivityDate(activity.occurredAt)}</span>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="dashboard-empty dashboard-empty--soft" style={adminEmptyStateStyle}>
                                    <strong>No rider activity yet</strong>
                                    <span>Rider registrations, sign-ins, claims, and delivery completions will show here.</span>
                                </div>
                            )}
                        </div>

                        <div style={adminListStyle}>
                            {riderHighlights.map((rider) => (
                                <article key={rider.name} style={adminInsightItemStyle}>
                                    <strong>{rider.name}</strong>
                                    <p>
                                        {rider.vehicle} | {rider.zone}
                                    </p>
                                    <div style={adminBadgeRowStyle}>
                                        <span style={adminBadgeStyle}>{rider.status}</span>
                                        <span style={adminBadgeStyle}>{rider.assignedDeliveries} delivery(ies)</span>
                                        <span style={adminBadgeStyle}>{rider.assignedBookings} booking(s)</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="admin-workspace__section" style={adminPanelStyle}>
                    <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                        <div>
                            <h2>Search all admin records</h2>
                            <p>Look up booking names, order codes, customers, riders, and addresses from one search bar.</p>
                        </div>
                    </div>

                    <PanelSearchBar
                        label="Search records"
                        placeholder="Search booking, order code, customer, rider, or address"
                        value={adminSearch}
                        onChange={setAdminSearch}
                        hint={
                            normalizedAdminSearch
                                ? `${filteredAppointments.length + filteredDeliveries.length + filteredCustomers.length + filteredRiders.length} match(es)`
                                : 'Search all admin records from one bar'
                        }
                        tone="admin"
                    />
                </section>

                {normalizedAdminSearch ? (
                    <section className="admin-workspace__section" style={adminPanelStyle}>
                        <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                            <div>
                                <h2>Matching admin records</h2>
                                <p>Quick counts and the closest matching admin records for your current search.</p>
                            </div>
                        </div>

                        <div className="admin-command__search-grid" style={adminCardGridStyle}>
                            <div>
                                <strong>{filteredAppointments.length}</strong>
                                <span>Bookings</span>
                            </div>
                            <div>
                                <strong>{filteredDeliveries.length}</strong>
                                <span>Deliveries</span>
                            </div>
                            <div>
                                <strong>{filteredCustomers.length}</strong>
                                <span>Customers</span>
                            </div>
                            <div>
                                <strong>{filteredRiders.length}</strong>
                                <span>Riders</span>
                            </div>
                        </div>

                        <div className="admin-command__search-list" style={adminListStyle}>
                            {adminSearchResults.length > 0 ? (
                                adminSearchResults.map((result, index) => (
                                    <article className="admin-command__search-item" key={`${result.group}-${result.title}-${index}`}>
                                        <span>{result.group}</span>
                                        <strong>{result.title}</strong>
                                        <p>{result.meta || 'Matching record'}</p>
                                    </article>
                                ))
                            ) : (
                                <div className="dashboard-empty dashboard-empty--soft" style={adminEmptyStateStyle}>
                                    <strong>No matching admin records</strong>
                                    <span>Try another customer, rider, code, or address.</span>
                                </div>
                            )}
                        </div>
                    </section>
                ) : null}

                <div className="admin-command__grid" style={adminTwoColumnStyle}>
                    <section className="admin-workspace__section" style={adminPanelStyle}>
                        <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                            <div>
                                <h2>Jump to the exact operations page</h2>
                                <p>Open the board you need without digging through the whole admin panel.</p>
                            </div>
                        </div>

                        <div className="admin-command__links" style={adminCardGridStyle}>
                            {quickLinks.map((link) => (
                                <a className="admin-command__link-card" href={link.href} key={link.href}>
                                    <strong>{link.title}</strong>
                                    <span>{link.text}</span>
                                </a>
                            ))}
                        </div>
                    </section>

                    <aside className="admin-workspace__section" style={adminPanelStyle}>
                        <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                            <div>
                                <h2>Current workload</h2>
                                <p>See how much work is already assigned across bookings, rider-claimed deliveries, and rider shifts.</p>
                            </div>
                        </div>

                        <div className="admin-command__watch-list" style={adminListStyle}>
                            <div>
                                <span>Bookings assigned</span>
                                <strong>{assignedBookingsCount}</strong>
                            </div>
                            <div>
                                <span>Deliveries assigned</span>
                                <strong>{assignedDeliveriesCount}</strong>
                            </div>
                            <div>
                                <span>Riders on shift</span>
                                <strong>{ridersOnShiftCount}</strong>
                            </div>
                        </div>
                    </aside>
                </div>

                <section className="admin-workspace__section" style={adminPanelStyle}>
                    <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                            <div>
                                <h2>All admin-visible activities</h2>
                                <p>Recent sign-ins, checkouts, rider claims, delivery progress, and booking assignment changes.</p>
                            </div>
                    </div>

                    <div className="admin-command__activity-list" style={adminListStyle}>
                        {activities.length > 0 ? (
                            activities.slice(0, 18).map((activity) => (
                                <article className={`admin-command__activity-item admin-command__activity-item--${activity.tone}`} key={activity.key}>
                                    <div className="admin-command__activity-top">
                                        <span>{activity.type}</span>
                                        <strong>{activity.title}</strong>
                                    </div>
                                    <p>{activity.detail}</p>
                                    <div className="admin-command__activity-meta">
                                        <span>{activity.actor}</span>
                                        <span>{formatActivityDate(activity.occurredAt)}</span>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="dashboard-empty dashboard-empty--soft" style={adminEmptyStateStyle}>
                                <strong>No activity yet</strong>
                                <span>Checkout, rider, customer, and admin actions will appear here.</span>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </section>
    );
}
