import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';

export default function ResetPasswordPage() {
    return (
        <>
            <PageHero
                eyebrow="Reset password"
                title="Choose a new password."
                text="Use the reset details you received to update your password and return to your account."
                actions={[
                    { href: '/forgot-password', label: 'Request another link' },
                    { href: '/login', label: 'Return to login', variant: 'ghost' },
                ]}
            />

            <section className="page-section">
                <DemoForm
                    title="Choose a new password"
                    description="Enter your reset details and choose a new password."
                    submitLabel="Reset password"
                    successMessage="Thanks. Your new password details are ready."
                    fields={[
                        { name: 'email', label: 'Email', type: 'email', placeholder: 'guest@inalogsilog.ph' },
                        { name: 'token', label: 'Reset token', placeholder: 'Paste your reset token' },
                        { name: 'password', label: 'New password', type: 'password', placeholder: 'New password' },
                        { name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Confirm new password' },
                    ]}
                />
            </section>
        </>
    );
}
