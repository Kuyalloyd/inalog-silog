import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';
import { registerMember } from '../../lib/memberAuth';

export default function RegisterPage() {
    return (
        <>
            <PageHero
                eyebrow="Create an account"
                title="Create your customer or rider account."
                text="Choose whether this account is for food ordering or for rider delivery access."
                actions={[
                    { href: '/login', label: 'Already a member? Login' },
                    { href: '/vip', label: 'See membership perks', variant: 'ghost' },
                ]}
                stats={[
                    { value: '2', label: 'Account types' },
                    { value: 'Ready', label: 'Instant account access' },
                    { value: '1', label: 'Signup flow' },
                ]}
            />

            <section className="page-section">
                <div className="auth-form-wrap">
                    <DemoForm
                        variant="auth"
                        title="Register"
                        description="Fill in your details and choose whether this is a customer or rider account. Rider fields only appear when Rider is selected."
                        submitLabel="Create account"
                        submittingLabel="Creating account..."
                        successMessage="Your account is ready."
                        idleMessage="Create your account here to start ordering food or opening the rider panel."
                        onSubmit={registerMember}
                        fields={[
                            {
                                name: 'accountType',
                                label: 'Account type',
                                type: 'select',
                                placeholder: 'Choose account type',
                                required: true,
                                options: ['Customer', 'Rider'],
                                full: true,
                            },
                            {
                                name: 'fullName',
                                label: 'Full name',
                                placeholder: 'Your full name',
                                required: true,
                                autoComplete: 'name',
                            },
                            {
                                name: 'contactNumber',
                                label: 'Contact number',
                                type: 'text',
                                placeholder: '0917 000 0000',
                                autoComplete: 'tel',
                            },
                            {
                                name: 'email',
                                label: 'Email',
                                type: 'email',
                                placeholder: 'you@example.com',
                                required: true,
                                autoComplete: 'email',
                            },
                            {
                                name: 'password',
                                label: 'Password',
                                type: 'password',
                                placeholder: 'Choose a password',
                                required: true,
                                autoComplete: 'new-password',
                            },
                            {
                                name: 'confirmPassword',
                                label: 'Confirm password',
                                type: 'password',
                                placeholder: 'Repeat your password',
                                required: true,
                                autoComplete: 'new-password',
                            },
                            { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Prefer not to say'] },
                            { name: 'region', label: 'Region', placeholder: 'Your region', autoComplete: 'address-level1' },
                            { name: 'district', label: 'District', placeholder: 'District or city', autoComplete: 'address-level2' },
                            {
                                name: 'riderCode',
                                label: 'Rider code',
                                placeholder: 'RDR-204',
                                autoComplete: 'off',
                                showWhen: { field: 'accountType', value: 'Rider' },
                            },
                            {
                                name: 'vehicle',
                                label: 'Vehicle',
                                type: 'select',
                                placeholder: 'Choose vehicle for rider account',
                                options: ['Motorbike', 'E-bike', 'Car'],
                                showWhen: { field: 'accountType', value: 'Rider' },
                            },
                            {
                                name: 'zone',
                                label: 'Delivery zone',
                                type: 'select',
                                placeholder: 'Choose route zone for rider account',
                                options: ['Butuan Central Route', 'Libertad Route', 'Ampayon Route', 'Downtown Route'],
                                showWhen: { field: 'accountType', value: 'Rider' },
                            },
                        ]}
                    />
                </div>
            </section>
        </>
    );
}
