import { useEffect, useState } from 'react';
import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';
import { getAdminAccountDetails, loginAdmin, readAdminSession } from '../../lib/adminAuth';
import { formatShortDate, getFirstName } from '../../lib/formatting';
import { loginMember } from '../../lib/memberAuth';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

const loginHeroImages = [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Chicken%20inasal%20with%20rice.jpg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Buttered%20Shrimp%2001.jpg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/BULALO.jpg',
];

export default function LoginPage() {
    const [member, setMember] = useState(null);
    const [adminSession, setAdminSession] = useState(() => readAdminSession());
    const [isCheckingSession, setIsCheckingSession] = useState(isSupabaseConfigured);
    const adminAccount = getAdminAccountDetails();

    useEffect(() => {
        setAdminSession(readAdminSession());

        function handleStorageChange(event) {
            if (!event.key || event.key === 'inalog-silog-admin-session' || event.key === 'inalog-silog-admin-auto-login') {
                setAdminSession(readAdminSession());
            }
        }

        window.addEventListener('storage', handleStorageChange);

        if (!isSupabaseConfigured || !supabase) {
            setIsCheckingSession(false);

            return () => {
                window.removeEventListener('storage', handleStorageChange);
            };
        }

        let isMounted = true;

        supabase.auth.getSession().then(({ data }) => {
            if (isMounted) {
                setMember(data.session?.user ?? null);
                setIsCheckingSession(false);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setMember(session?.user ?? null);
            setIsCheckingSession(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    async function handleLogin(values) {
        if (values.accountType === 'Admin') {
            return loginAdmin(values);
        }

        return loginMember(values);
    }

    const fullName = member?.user_metadata?.full_name || member?.email || '';
    const firstName = getFirstName(fullName);
    const memberRole = member?.user_metadata?.role === 'rider' ? 'Rider' : 'Customer';

    return (
        <>
            <PageHero
                eyebrow="Online food login"
                title="Welcome back."
                text="Choose customer, rider, or admin, then sign in to open the correct online food workspace."
                images={loginHeroImages}
                actions={[
                    { href: '/register', label: 'Create a new account' },
                    { href: '/admin/login', label: 'Admin login', variant: 'ghost' },
                    { href: '/forgot-password', label: 'Forgot password', variant: 'ghost' },
                ]}
                stats={[
                    { value: '3', label: 'Access roles' },
                    { value: 'Online', label: 'Food system' },
                    { value: 'Easy', label: 'Fast panel entry' },
                ]}
            />

            <section className="page-section split-layout split-layout--auth">
                <div className="panel-stack auth-side">
                    {member ? (
                        <div className="note-strip note-strip--soft">
                            <strong>{memberRole} session active</strong>
                            <span>
                                {firstName} is already signed in. You can still use this page to switch accounts, or go to{' '}
                                <a href={memberRole === 'Rider' ? '/rider' : '/dashboard'}>{memberRole === 'Rider' ? 'the rider panel' : 'the dashboard'}</a>.
                            </span>
                        </div>
                    ) : null}

                    {adminSession ? (
                        <div className="note-strip note-strip--soft">
                            <strong>Admin session active</strong>
                            <span>
                                {adminSession.email} is already signed in on this browser. Open the <a href="/admin">admin panel</a> or{' '}
                                <a href="/admin/logout">log out admin</a> if you want a fresh admin sign-in.
                            </span>
                        </div>
                    ) : null}

                    <section className="panel-card">
                        <h3 className="panel-card__title">What you can do after login</h3>
                        <div className="panel-card__list">
                            <div className="mini-item">
                                <strong>Choose your role</strong>
                                <span>Customer login opens food ordering tools, rider login opens dispatch tools, and admin opens the website operations panel.</span>
                            </div>
                            <div className="mini-item">
                                <strong>Online food focus</strong>
                                <span>This login is for online ordering, delivery tracking, account access, and rider operations.</span>
                            </div>
                            <div className="mini-item">
                                <strong>Admin account</strong>
                                <span>Admin uses {adminAccount.email} and opens the bookings, customers, riders, and deliveries workspace.</span>
                            </div>
                            {member ? (
                                <div className="mini-item">
                                    <strong>Current member session</strong>
                                    <span>
                                        {fullName || member.email} signed in on {formatShortDate(member.created_at)}.
                                    </span>
                                </div>
                            ) : null}
                            {isCheckingSession ? (
                                <div className="mini-item">
                                    <strong>Checking saved session</strong>
                                    <span>Please wait while the system checks whether this browser already has a customer or rider session.</span>
                                </div>
                            ) : null}
                        </div>
                    </section>
                </div>

                <div className="auth-form-wrap">
                    <DemoForm
                        variant="auth"
                        title="Sign in"
                        description="Choose your role and enter your account details to continue."
                        submitLabel="Login"
                        submittingLabel="Signing in..."
                        successMessage="Login successful."
                        idleMessage="Select customer, rider, or admin, then sign in with the correct account for that role."
                        onSubmit={handleLogin}
                        fields={[
                            {
                                name: 'accountType',
                                label: 'Login as',
                                type: 'select',
                                placeholder: 'Choose login type',
                                required: true,
                                options: ['Customer', 'Rider', 'Admin'],
                                full: true,
                            },
                            {
                                name: 'email',
                                label: 'Email',
                                type: 'email',
                                placeholder: 'guest@inalogsilog.ph',
                                required: true,
                                autoComplete: 'email',
                            },
                            {
                                name: 'password',
                                label: 'Password',
                                type: 'password',
                                placeholder: 'Enter your password',
                                required: true,
                                autoComplete: 'current-password',
                            },
                        ]}
                    />
                </div>
            </section>
        </>
    );
}
