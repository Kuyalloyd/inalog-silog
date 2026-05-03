import { logAdminActivity } from './adminActivityLog';

const ADMIN_SESSION_KEY = 'inalog-silog-admin-session';
const ADMIN_AUTO_LOGIN_KEY = 'inalog-silog-admin-auto-login';

const ADMIN_ACCOUNT = {
    email: 'admininalog@gmail.com',
    password: 'inalogsilog',
    role: 'admin',
    name: 'Inalog Silog Admin',
};

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeEmail(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function notifyAdminSessionChange() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
    }
}

export function readAdminSession() {
    if (!canUseStorage()) {
        return null;
    }

    if (window.localStorage.getItem(ADMIN_AUTO_LOGIN_KEY) === 'true') {
        window.localStorage.removeItem(ADMIN_AUTO_LOGIN_KEY);
        window.localStorage.removeItem(ADMIN_SESSION_KEY);
        return null;
    }

    try {
        const rawValue = window.localStorage.getItem(ADMIN_SESSION_KEY);

        if (!rawValue) {
            return null;
        }

        const parsedValue = JSON.parse(rawValue);

        if (normalizeEmail(parsedValue?.email) !== ADMIN_ACCOUNT.email) {
            return null;
        }

        return {
            email: ADMIN_ACCOUNT.email,
            role: ADMIN_ACCOUNT.role,
            name: ADMIN_ACCOUNT.name,
            signedInAt: parsedValue?.signedInAt || new Date().toISOString(),
        };
    } catch {
        return null;
    }
}

export function getAdminAccountDetails() {
    return {
        email: ADMIN_ACCOUNT.email,
        role: ADMIN_ACCOUNT.role,
        name: ADMIN_ACCOUNT.name,
    };
}

export async function loginAdmin(values) {
    const email = normalizeEmail(values.email);
    const password = typeof values.password === 'string' ? values.password : '';

    if (!email) {
        throw new Error('Enter the admin email before signing in.');
    }

    if (!password) {
        throw new Error('Enter the admin password before signing in.');
    }

    if (email !== ADMIN_ACCOUNT.email || password !== ADMIN_ACCOUNT.password) {
        throw new Error('The admin email or password is incorrect.');
    }

    const session = {
        email: ADMIN_ACCOUNT.email,
        role: ADMIN_ACCOUNT.role,
        name: ADMIN_ACCOUNT.name,
        signedInAt: new Date().toISOString(),
    };

    if (canUseStorage()) {
        window.localStorage.removeItem(ADMIN_AUTO_LOGIN_KEY);
        window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        notifyAdminSessionChange();
    }

    logAdminActivity({
        type: 'Admin',
        title: 'Admin signed in',
        detail: ADMIN_ACCOUNT.email,
        actor: ADMIN_ACCOUNT.name,
        tone: 'green',
        occurredAt: session.signedInAt,
    });

    return {
        successMessage: 'Admin login successful. Redirecting to the admin dashboard...',
        redirectTo: '/admin?entry=login',
        resetForm: false,
    };
}

export function logoutAdmin() {
    const currentSession = readAdminSession();

    if (currentSession) {
        logAdminActivity({
            type: 'Admin',
            title: 'Admin signed out',
            detail: currentSession.email,
            actor: currentSession.name,
            tone: 'ink',
        });
    }

    if (!canUseStorage()) {
        return;
    }

    window.localStorage.removeItem(ADMIN_AUTO_LOGIN_KEY);
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    notifyAdminSessionChange();
}
