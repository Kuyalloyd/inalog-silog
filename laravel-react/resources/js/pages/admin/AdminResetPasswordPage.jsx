import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';

export default function AdminResetPasswordPage() {
    return (
        <>
            <PageHero
                eyebrow="Admin password reset"
                title="Choose a new admin password."
                text="Use the reset details you received to update your admin password and regain access."
                actions={[
                    { href: '/admin/login', label: 'Back to admin login' },
                    { href: '/admin/forgot-password', label: 'Need another reset link?', variant: 'ghost' },
                ]}
            />

            <section className="page-section">
                <DemoForm
                    title="Choose a new admin password"
                    description="Enter the reset details and choose a new password."
                    submitLabel="Reset admin password"
                    successMessage="Thanks. Your admin reset details are ready."
                    fields={[
                        { name: 'email', label: 'Admin email', type: 'email', placeholder: 'admin@inalogsilog.ph' },
                        { name: 'token', label: 'Reset token', placeholder: 'Paste the reset token' },
                        { name: 'password', label: 'New password', type: 'password', placeholder: 'New password' },
                        { name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Repeat new password' },
                    ]}
                />
            </section>
        </>
    );
}
