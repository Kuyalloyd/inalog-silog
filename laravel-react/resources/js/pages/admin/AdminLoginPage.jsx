import { useEffect, useState } from 'react';
import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';
import { getAdminAccountDetails, loginAdmin, readAdminSession } from '../../lib/adminAuth';

export default function AdminLoginPage() {
    const [adminSession, setAdminSession] = useState(() => readAdminSession());
    const adminAccount = getAdminAccountDetails();

    useEffect(() => {
        setAdminSession(readAdminSession());
    }, []);

    if (adminSession) {
        return (
            <>
                <PageHero
                    eyebrow="Admin session active"
                    title="The admin account is already signed in."
                    text="You can open the admin dashboard right away to manage appointments, deliveries, assigned riders, customer details, and rider information."
                    actions={[
                        { href: '/admin', label: 'Open admin dashboard' },
                        { href: '/admin/logout', label: 'Admin logout', variant: 'ghost' },
                    ]}
                    stats={[
                        { value: 'Live', label: 'Admin session' },
                        { value: 'Admin', label: 'Role access' },
                        { value: adminAccount.email, label: 'Signed-in email' },
                    ]}
                />

                <section className="page-section">
                    <div className="panel-card route-state">
                        <p className="eyebrow">Admin account</p>
                        <h2 className="panel-card__title">{adminAccount.email}</h2>
                        <p className="form-card__text">Your admin account is active, so this page now switches to an admin access panel instead of the login form.</p>
                    </div>
                </section>
            </>
        );
    }

    return (
        <>
            <PageHero
                eyebrow="Admin access"
                title="Sign in to the admin operations panel."
                text="Use the dedicated admin account to manage bookings, deliveries, assigned riders, customer records, and rider information."
                actions={[
                    { href: '/admin', label: 'View admin dashboard' },
                    { href: '/admin/forgot-password', label: 'Admin recovery', variant: 'ghost' },
                ]}
                stats={[
                    { value: 'Admin', label: 'Separate auth path' },
                    { value: 'Secure', label: 'Access point' },
                    { value: 'Daily', label: 'Operations use' },
                ]}
            />

            <section className="page-section split-layout split-layout--auth">
                <div className="panel-stack auth-side">
                    <div className="note-strip">
                        <strong>Admin account</strong>
                        <span>This login is separate from the customer and rider panels so only admin can open the operations dashboard.</span>
                    </div>

                    <section className="panel-card">
                        <h3 className="panel-card__title">Admin access details</h3>
                        <div className="panel-card__list">
                            <div className="mini-item">
                                <strong>Admin email</strong>
                                <span>{adminAccount.email}</span>
                            </div>
                            <div className="mini-item">
                                <strong>Admin role</strong>
                                <span>Can see appointments, riders, deliveries, and customer information.</span>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="auth-form-wrap">
                    <DemoForm
                        variant="auth"
                        title="Admin login"
                        description="Enter the admin email and password to continue to the admin dashboard."
                        submitLabel="Login as admin"
                        submittingLabel="Opening admin dashboard..."
                        successMessage="Admin account accepted."
                        idleMessage="Use the admin account to access the staff operations dashboard."
                        onSubmit={loginAdmin}
                        fields={[
                            {
                                name: 'email',
                                label: 'Admin email',
                                type: 'email',
                                placeholder: adminAccount.email,
                                required: true,
                                autoComplete: 'email',
                            },
                            {
                                name: 'password',
                                label: 'Password',
                                type: 'password',
                                placeholder: 'Enter the admin password',
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
