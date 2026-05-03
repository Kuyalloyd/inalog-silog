import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';

export default function ForgotPasswordPage() {
    return (
        <>
            <PageHero
                eyebrow="Password recovery"
                title="Request a password reset link."
                text="Enter your registered email and follow the recovery steps to update your password."
                actions={[
                    { href: '/login', label: 'Back to login' },
                    { href: '/reset-password', label: 'View reset screen', variant: 'ghost' },
                ]}
                stats={[
                    { value: 'Secure', label: 'Recovery step' },
                    { value: 'Email', label: 'Reset delivery' },
                    { value: 'Account', label: 'Access support' },
                ]}
            />

            <section className="page-section">
                <DemoForm
                    title="Send reset email"
                    description="Enter the email linked to your account."
                    submitLabel="Send reset link"
                    successMessage="Thanks. Your reset request details are ready."
                    fields={[{ name: 'email', label: 'Registered email', type: 'email', placeholder: 'guest@inalogsilog.ph', full: true }]}
                />
            </section>
        </>
    );
}
