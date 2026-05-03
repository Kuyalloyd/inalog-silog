import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';

export default function VipActivationPage() {
    return (
        <>
            <PageHero
                eyebrow="Activate VIP"
                title="Complete your membership activation details."
                text="Enter your member details to continue with VIP activation and enjoy premium dining perks."
                actions={[
                    { href: '/vip', label: 'Back to VIP overview' },
                    { href: '/dashboard', label: 'Go to dashboard', variant: 'ghost' },
                ]}
                stats={[
                    { value: '500', label: 'Activation amount' },
                    { value: 'VIP', label: 'Member access' },
                    { value: 'Premium', label: 'Dining perks' },
                ]}
            />

            <section className="page-section">
                <DemoForm
                    title="Activate membership"
                    description="Enter your email and activation amount to continue with membership review."
                    submitLabel="Activate VIP"
                    successMessage="Thanks. Your activation details are ready for review."
                    tableName="vip_membership_activations"
                    prepareSubmission={(values) => ({
                        email: values.email,
                        activation_amount: Number(String(values.amount).replace(/[^\d.]/g, '')) || null,
                        source_page: '/vip/activate',
                    })}
                    fields={[
                        { name: 'email', label: 'Member email', type: 'email', placeholder: 'guest@inalogsilog.ph' },
                        { name: 'amount', label: 'Activation amount', placeholder: 'PHP 500' },
                    ]}
                />
            </section>
        </>
    );
}
