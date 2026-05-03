import { isSupabaseConfigured, supabase } from './supabaseClient';
import { logoutAdmin } from './adminAuth';
import { clearRiderSession, saveRiderSessionFromMember } from './riderSession';
import { logAdminActivity } from './adminActivityLog';

function requireSupabaseAuth() {
    if (!isSupabaseConfigured || !supabase) {
        throw new Error('Hindi pa naka-set ang Supabase Auth para sa website na ito.');
    }
}

function clearStoredBrowserSessions() {
    logoutAdmin();
    clearRiderSession();

    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    window.localStorage.removeItem('inalog-silog-auth');
}

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function normalizeAccountRole(value) {
    return typeof value === 'string' && value.trim().toLowerCase() === 'rider' ? 'rider' : 'customer';
}

function normalizeLoginRole(value) {
    return normalizeAccountRole(value);
}

function getPostAuthRedirect(role, source = 'login') {
    if (role === 'rider') {
        return '/rider?entry=login';
    }

    return source === 'register' ? '/dashboard?entry=register' : '/dashboard?entry=login';
}

function buildRiderActivityDetail(values, email) {
    return [
        email,
        values.riderCode || 'No code',
        values.vehicle || 'Vehicle not set',
        values.zone || 'Zone not set',
        values.contactNumber || 'No contact',
    ].join(' | ');
}

function buildCustomerActivityDetail(values, email, metadata = {}) {
    return [
        email,
        values.contactNumber || metadata.contact_number || 'No contact',
        values.district || metadata.district || 'No district',
        values.region || metadata.region || 'No region',
    ].join(' | ');
}

function syncRoleWorkspace(user, fallbackValues = {}) {
    const role = normalizeAccountRole(user?.user_metadata?.role || user?.user_metadata?.account_type || fallbackValues.accountType);

    if (role === 'rider') {
        saveRiderSessionFromMember(user, fallbackValues);
    } else {
        clearRiderSession();
    }

    return role;
}

function toFriendlyAuthError(error) {
    const message = error?.message || '';
    const normalizedMessage = message.toLowerCase();

    if (
        normalizedMessage.includes('email not confirmed') ||
        normalizedMessage.includes('email not verified') ||
        normalizedMessage.includes('confirm your email') ||
        normalizedMessage.includes('not confirmed')
    ) {
        return new Error('This email is tied to an older unconfirmed account. Delete that old user in Supabase Authentication > Users or use a different email, then sign up again.');
    }

    if (normalizedMessage.includes('invalid login credentials')) {
        return new Error('The email or password is incorrect. Please try again.');
    }

    return error instanceof Error ? error : new Error(message || 'Something went wrong with your account request.');
}

async function signInImmediately(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw toFriendlyAuthError(error);
    }

    return data;
}

export async function registerMember(values) {
    requireSupabaseAuth();

    if (!values.fullName) {
        throw new Error('Ilagay ang buong pangalan mo.');
    }

    if (!values.email) {
        throw new Error('Ilagay ang email mo.');
    }

    if (!values.accountType) {
        throw new Error('Piliin kung customer o rider ang account.');
    }

    if (!values.password) {
        throw new Error('Ilagay ang password mo.');
    }

    if (values.password.length < 6) {
        throw new Error('Gumamit ng password na may hindi bababa sa 6 na character.');
    }

    if (values.password !== values.confirmPassword) {
        throw new Error('Hindi magkapareho ang password at confirm password.');
    }

    const role = normalizeAccountRole(values.accountType);
    const email = normalizeEmail(values.email);
    const { data, error } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: {
            emailRedirectTo: `${window.location.origin}/verify`,
            data: {
                full_name: values.fullName,
                role,
                account_type: role,
                gender: values.gender || null,
                region: values.region || null,
                district: values.district || null,
                rider_code: role === 'rider' ? values.riderCode || null : null,
                vehicle: role === 'rider' ? values.vehicle || null : null,
                zone: role === 'rider' ? values.zone || null : null,
                contact_number: values.contactNumber || null,
            },
        },
    });

    if (error) {
        throw toFriendlyAuthError(error);
    }

    if (data.session) {
        await supabase.auth.signOut();
        clearRiderSession();

        logAdminActivity({
            type: role === 'rider' ? 'Rider' : 'Customer',
            title: role === 'rider' ? 'Rider account created' : 'Customer account created',
            detail: role === 'rider' ? buildRiderActivityDetail(values, email) : buildCustomerActivityDetail(values, email),
            actor: values.fullName,
            tone: role === 'rider' ? 'green' : 'gold',
        });

        return {
            successMessage:
                role === 'rider'
                    ? 'Rider account created successfully. Redirecting to login...'
                    : 'Account created successfully. Redirecting to login...',
            redirectTo: '/login?entry=register',
            redirectDelayMs: 1600,
            resetForm: false,
        };
    }

    clearRiderSession();

    logAdminActivity({
        type: role === 'rider' ? 'Rider' : 'Customer',
        title: role === 'rider' ? 'Rider account created' : 'Customer account created',
        detail: role === 'rider' ? buildRiderActivityDetail(values, email) : buildCustomerActivityDetail(values, email),
        actor: values.fullName,
        tone: role === 'rider' ? 'green' : 'gold',
    });

    return {
        successMessage:
            role === 'rider'
                ? 'Rider account created. Check your email verification first, then continue to login.'
                : 'Account created. Check your email verification first, then continue to login.',
        redirectTo: `/verify?entry=register&email=${encodeURIComponent(email)}`,
        redirectDelayMs: 1700,
        resetForm: false,
    };
}

export async function loginMember(values) {
    if (!values.accountType) {
        throw new Error('Piliin kung customer o rider ang login mo.');
    }

    if (!values.email) {
        throw new Error('Ilagay ang email mo.');
    }

    if (!values.password) {
        throw new Error('Ilagay ang password mo.');
    }

    const selectedRole = normalizeLoginRole(values.accountType);

    requireSupabaseAuth();

    const authData = await signInImmediately(normalizeEmail(values.email), values.password);
    const role = syncRoleWorkspace(authData.user, values);

    if (selectedRole !== role) {
        await supabase.auth.signOut();
        clearRiderSession();
        throw new Error(
            selectedRole === 'rider'
                ? 'Hindi rider account ang email na ito. Piliin ang customer login o gumamit ng rider account.'
                : 'Hindi customer account ang email na ito. Piliin ang rider login kung rider account ang gamit mo.',
        );
    }

    logAdminActivity({
        type: role === 'rider' ? 'Rider' : 'Customer',
        title: role === 'rider' ? 'Rider signed in' : 'Customer signed in',
        detail:
            role === 'rider'
                ? buildRiderActivityDetail(values, authData.user.email || normalizeEmail(values.email))
                : buildCustomerActivityDetail(values, authData.user.email || normalizeEmail(values.email), authData.user.user_metadata || {}),
        actor: authData.user.user_metadata?.full_name || normalizeEmail(values.email),
        tone: role === 'rider' ? 'green' : 'gold',
    });

    return {
        successMessage:
            role === 'rider'
                ? 'Login successful. Redirecting to your rider panel...'
                : 'Login successful. Redirecting to your dashboard...',
        redirectTo: getPostAuthRedirect(role, 'login'),
        resetForm: false,
    };
}

export async function resendSignupVerification(values) {
    requireSupabaseAuth();

    if (!values.email) {
        throw new Error('Enter the email you used when creating your account.');
    }

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizeEmail(values.email),
        options: {
            emailRedirectTo: `${window.location.origin}/verify`,
        },
    });

    if (error) {
        throw toFriendlyAuthError(error);
    }

    return {
        successMessage: 'A new verification email has been sent. Check your inbox and spam folder.',
    };
}

export async function logoutMember() {
    clearStoredBrowserSessions();

    if (!isSupabaseConfigured || !supabase) {
        return;
    }

    try {
        await supabase.auth.signOut();
    } finally {
        clearStoredBrowserSessions();
    }
}
