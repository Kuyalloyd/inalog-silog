import { isSupabaseConfigured, supabase } from './supabaseClient';

const APPOINTMENT_ASSIGNMENTS_KEY = 'inalog-silog-admin-appointment-assignments';

export const appointmentAssignees = [
    'Unassigned',
    'Host Carla',
    'Supervisor Nico',
    'VIP Coordinator Ana',
    'Event Lead Liza',
    'Rider Marco',
];

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function toText(value, fallback = '') {
    if (typeof value !== 'string') {
        return fallback;
    }

    const normalizedValue = value.trim();

    return normalizedValue || fallback;
}

function readAssignmentStore() {
    if (!canUseStorage()) {
        return {};
    }

    try {
        const rawValue = window.localStorage.getItem(APPOINTMENT_ASSIGNMENTS_KEY);

        if (!rawValue) {
            return {};
        }

        const parsedValue = JSON.parse(rawValue);

        return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
    } catch {
        return {};
    }
}

function writeAssignmentStore(value) {
    if (!canUseStorage()) {
        return;
    }

    window.localStorage.setItem(APPOINTMENT_ASSIGNMENTS_KEY, JSON.stringify(value));
}

function normalizeStatus(value, fallback) {
    const normalizedValue = toText(value, fallback);

    return normalizedValue || fallback;
}

function buildKey(prefix, record, dateValue, timeValue, emailValue) {
    const recordId = record?.id ?? record?.booking_id ?? record?.request_id ?? 'record';

    return `${prefix}:${recordId}:${dateValue || 'no-date'}:${timeValue || 'no-time'}:${emailValue || 'no-email'}`;
}

function getBookingAccountMeta(record) {
    const linkedAccountId = toText(record?.user_id || record?.member_id || record?.customer_id || record?.auth_user_id || record?.profile_id);

    if (linkedAccountId) {
        return {
            accountType: 'linked',
            accountLabel: 'Registered account',
            accountHint: 'Submitted from a linked member account.',
        };
    }

    return {
        accountType: 'guest',
        accountLabel: 'Guest form entry',
        accountHint: 'This booking form can be submitted without signing in.',
    };
}

function mapTableBooking(record, assignments) {
    const scheduleDate = toText(record.booking_date);
    const scheduleTime = toText(record.booking_time, 'To be confirmed');
    const email = toText(record.email);
    const key = buildKey('table', record, scheduleDate, scheduleTime, email);
    const accountMeta = getBookingAccountMeta(record);

    return {
        key,
        type: 'Table Booking',
        customerName: toText(record.guest_name, 'Walk-in guest'),
        email: email || 'No email provided',
        scheduleDate,
        scheduleTime,
        status: normalizeStatus(record.status, 'Pending confirmation'),
        locationLabel: toText(record.seat_code, 'Seat not selected'),
        notes: toText(record.service_window, 'Standard table service'),
        assignedTo: assignments[key] || toText(record.assigned_staff || record.assigned_to, 'Unassigned'),
        sourcePath: '/bookings/table',
        partyLabel: toText(record.guest_count, 'Table request'),
        createdAt: record.created_at || '',
        accountType: accountMeta.accountType,
        accountLabel: accountMeta.accountLabel,
        accountHint: accountMeta.accountHint,
    };
}

function mapVipBooking(record, assignments) {
    const scheduleDate = toText(record.booking_date);
    const scheduleTime = toText(record.booking_time, 'To be confirmed');
    const email = toText(record.email);
    const key = buildKey('vip', record, scheduleDate, scheduleTime, email);
    const accountMeta = getBookingAccountMeta(record);

    return {
        key,
        type: 'VIP Booking',
        customerName: toText(record.guest_name, 'VIP guest'),
        email: email || 'No email provided',
        scheduleDate,
        scheduleTime,
        status: normalizeStatus(record.status, 'Pending VIP confirmation'),
        locationLabel: toText(record.vip_section || record.seat_code, 'VIP section pending'),
        notes: toText(record.decor_option, 'VIP dining request'),
        assignedTo: assignments[key] || toText(record.assigned_staff || record.assigned_to, 'Unassigned'),
        sourcePath: '/bookings/vip',
        partyLabel: toText(record.guest_count, 'VIP request'),
        createdAt: record.created_at || '',
        accountType: accountMeta.accountType,
        accountLabel: accountMeta.accountLabel,
        accountHint: accountMeta.accountHint,
    };
}

function mapEventBooking(record, assignments) {
    const scheduleDate = toText(record.target_date);
    const scheduleTime = toText(record.target_time, 'Planning stage');
    const email = toText(record.email);
    const key = buildKey('event', record, scheduleDate, scheduleTime, email);
    const guestCount = Number(record.guest_count);
    const accountMeta = getBookingAccountMeta(record);

    return {
        key,
        type: 'Event Request',
        customerName: toText(record.contact_name, 'Event contact'),
        email: email || 'No email provided',
        scheduleDate,
        scheduleTime,
        status: normalizeStatus(record.status, 'Awaiting quote review'),
        locationLabel: toText(record.event_type, 'Event request'),
        notes: toText(record.event_brief, 'No event brief added yet.'),
        assignedTo: assignments[key] || toText(record.assigned_staff || record.assigned_to, 'Unassigned'),
        sourcePath: '/bookings/event',
        partyLabel: guestCount > 0 ? `${guestCount} guests` : 'Guest count pending',
        createdAt: record.created_at || '',
        accountType: accountMeta.accountType,
        accountLabel: accountMeta.accountLabel,
        accountHint: accountMeta.accountHint,
    };
}

function toSortableStamp(appointment) {
    const combinedValue = `${appointment.scheduleDate || ''} ${appointment.scheduleTime || ''}`.trim();
    const combinedDate = new Date(combinedValue);

    if (!Number.isNaN(combinedDate.getTime())) {
        return combinedDate.getTime();
    }

    const createdAtDate = new Date(appointment.createdAt || '');

    if (!Number.isNaN(createdAtDate.getTime())) {
        return createdAtDate.getTime();
    }

    return 0;
}

function sortAppointments(appointments) {
    return [...appointments].sort((left, right) => toSortableStamp(left) - toSortableStamp(right));
}

async function fetchTableRecords(tableName) {
    const { data, error } = await supabase.from(tableName).select('*').limit(20);

    if (error) {
        throw error;
    }

    return Array.isArray(data) ? data : [];
}

export async function fetchAdminAppointments() {
    const assignments = readAssignmentStore();

    if (!isSupabaseConfigured || !supabase) {
        return {
            appointments: [],
            isDemoData: false,
            warnings: ['Booking tables are not connected yet, so only real Supabase booking records can appear here after setup.'],
        };
    }

    const results = await Promise.allSettled([
        fetchTableRecords('table_bookings'),
        fetchTableRecords('vip_bookings'),
        fetchTableRecords('event_booking_requests'),
    ]);

    const warnings = [];
    const appointments = [];

    if (results[0].status === 'fulfilled') {
        appointments.push(...results[0].value.map((record) => mapTableBooking(record, assignments)));
    } else {
        warnings.push('Table bookings could not be loaded.');
    }

    if (results[1].status === 'fulfilled') {
        appointments.push(...results[1].value.map((record) => mapVipBooking(record, assignments)));
    } else {
        warnings.push('VIP bookings could not be loaded.');
    }

    if (results[2].status === 'fulfilled') {
        appointments.push(...results[2].value.map((record) => mapEventBooking(record, assignments)));
    } else {
        warnings.push('Event requests could not be loaded.');
    }

    if (appointments.length === 0) {
        return {
            appointments: [],
            isDemoData: false,
            warnings: warnings.length > 0 ? warnings : ['No booking records were found yet.'],
        };
    }

    return {
        appointments: sortAppointments(appointments),
        isDemoData: false,
        warnings,
    };
}

export function saveAppointmentAssignment(appointmentKey, assignedTo) {
    const nextAssignments = {
        ...readAssignmentStore(),
        [appointmentKey]: assignedTo,
    };

    writeAssignmentStore(nextAssignments);

    return nextAssignments;
}
