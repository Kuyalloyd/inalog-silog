import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';

export default function AdminForgotPasswordPage() {
    return (
        <>
            <PageHero
                eyebrow="Admin recovery"
                title="Request an admin password reset link."
                text="Enter the admin email tied to the account to begin the recovery process."
                actions={[
                    { href: '/admin/login', label: 'Back to admin login' },
                    { href: '/admin/reset-password', label: 'Reset screen', variant: 'ghost' },
                ]}
            />

            <section className="page-section">
                <DemoForm
                    title="Send admin reset link"
                    description="Enter the email linked to the admin account."
                    submitLabel="Send admin reset link"
                    successMessage="Thanks. Your admin recovery details are ready."
                    fields={[{ name: 'email', label: 'Admin email', type: 'email', placeholder: 'admin@inalogsilog.ph', full: true }]}
                />
            </section>
        </>
    );
}
