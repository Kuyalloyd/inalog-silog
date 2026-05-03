import AdminWorkspaceHeader from '../../components/AdminWorkspaceHeader';
import { appointmentAssignees } from '../../lib/adminAppointments';
import { formatShortDate } from '../../lib/formatting';
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

export default function AdminAppointmentsPage() {
    const { adminSession, appointments, appointmentWarnings, isLoading, errorMessage, loadAdminPanel, handleAppointmentAssignmentChange } = useAdminPanelData();
    const guestBookingCount = appointments.filter((item) => item.accountType === 'guest').length;

    if (!adminSession) {
        return (
            <section className="page-section">
                <div className="panel-card dashboard-guest">
                    <p className="eyebrow">Admin appointments page</p>
                    <h1 className="panel-card__title">Sign in as admin first.</h1>
                    <p className="form-card__text">Appointments are now on their own admin page.</p>
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
                    eyebrow="Bookings board"
                    title="Bookings and staff assignments."
                    text="Review real table, VIP, and event booking requests from one organized admin page."
                    actions={[
                        { href: '/admin', label: 'Overview' },
                        { href: '/admin/deliveries', label: 'Deliveries', variant: 'ghost' },
                        { label: isLoading ? 'Refreshing...' : 'Refresh', variant: 'ghost', onClick: loadAdminPanel, disabled: isLoading },
                    ]}
                    stats={[
                        { value: `${appointments.length}`, label: 'Bookings' },
                        { value: `${appointments.filter((item) => item.assignedTo !== 'Unassigned').length}`, label: 'Assigned' },
                        { value: `${appointments.filter((item) => item.assignedTo === 'Unassigned').length}`, label: 'Unassigned' },
                        { value: `${guestBookingCount}`, label: 'Guest forms' },
                    ]}
                />

                {appointmentWarnings.length > 0 ? (
                    <div className="note-strip note-strip--soft">
                        <strong>Booking data</strong>
                        <span>{appointmentWarnings.join(' ')}</span>
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
                        <strong>Guest booking entries</strong>
                        <span>
                            {guestBookingCount} booking record(s) were submitted from the public booking form without a linked customer account, so the name may not
                            match a registered user.
                        </span>
                    </div>
                ) : null}

                <section className="admin-workspace__section" style={adminPanelStyle}>
                    <div className="admin-workspace__section-head" style={adminSectionHeadStyle}>
                        <div>
                            <h2>Active booking records</h2>
                            <p>Only real booking rows appear here now. Demo names were removed, and guest form entries are labeled clearly.</p>
                        </div>
                    </div>

                    <div className="admin-appointments" style={adminListStyle}>
                        {appointments.length > 0 ? (
                            appointments.map((appointment) => (
                                <article className="admin-appointment-card" key={appointment.key}>
                                    <div className="admin-appointment-card__top">
                                        <div>
                                            <p className="eyebrow">{appointment.type}</p>
                                            <h3 className="admin-appointment-card__title">{appointment.customerName}</h3>
                                        </div>
                                        <span className={`table-list__status table-list__status--${getStatusTone(appointment.status)}`}>{appointment.status}</span>
                                    </div>

                                    <div className="admin-appointment-card__meta">
                                        <span>{appointment.email}</span>
                                        <span>{appointment.partyLabel}</span>
                                        <span>{appointment.locationLabel}</span>
                                        <span>{appointment.accountLabel}</span>
                                    </div>

                                    <div className="admin-appointment-card__grid">
                                        <div className="admin-appointment-card__info">
                                            <span>Appointment date</span>
                                            <strong>{appointment.scheduleDate ? formatShortDate(appointment.scheduleDate) : 'Date not set'}</strong>
                                        </div>
                                        <div className="admin-appointment-card__info">
                                            <span>Time or stage</span>
                                            <strong>{appointment.scheduleTime}</strong>
                                        </div>
                                        <div className="admin-appointment-card__info">
                                            <span>Assigned to</span>
                                            <strong>{appointment.assignedTo}</strong>
                                        </div>
                                        <div className="admin-appointment-card__info">
                                            <span>Record type</span>
                                            <strong>{appointment.accountLabel}</strong>
                                        </div>
                                    </div>

                                    <p className="admin-appointment-card__notes">
                                        {appointment.notes}
                                        {appointment.accountHint ? ` ${appointment.accountHint}` : ''}
                                    </p>

                                    <div className="admin-appointment-card__footer">
                                        <label className="admin-appointment-card__assignment">
                                            <span>Change assignee</span>
                                            <select
                                                value={appointment.assignedTo}
                                                onChange={(event) => handleAppointmentAssignmentChange(appointment.key, event.target.value)}
                                            >
                                                {appointmentAssignees.map((assignee) => (
                                                    <option key={assignee} value={assignee}>
                                                        {assignee}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <a className="button-link--ghost" href={appointment.sourcePath}>
                                            Open source form
                                        </a>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="admin-empty-state" style={adminEmptyStateStyle}>
                                <strong>No booking records yet</strong>
                                <span>There are no table, VIP, or event bookings yet. If you are using the online food flow first, check deliveries and customers while booking forms are still unused.</span>
                                <div className="page-hero__actions">
                                    <a className="button-link" href="/admin/deliveries">
                                        Open deliveries
                                    </a>
                                    <a className="button-link--ghost" href="/admin/customers">
                                        Open customers
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
