import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';
import { resendSignupVerification } from '../../lib/memberAuth';

export default function VerifyPage() {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const registeredEmail = searchParams?.get('email') || '';
    const cameFromRegister = searchParams?.get('entry') === 'register';

    return (
        <>
            <PageHero
                eyebrow="Email verification"
                title="Confirm your email address."
                text={
                    cameFromRegister
                        ? 'Your account was created. Verify your email first, then return to login to continue.'
                        : 'Email verification helps keep your account secure and unlocks the full member experience.'
                }
                actions={[
                    { href: '/login', label: 'Go to login' },
                    { href: '/register', label: 'Create another account', variant: 'ghost' },
                ]}
                stats={[
                    { value: 'Verify', label: 'Account step' },
                    { value: 'Secure', label: 'Member access' },
                    { value: 'Fast', label: 'Return to login' },
                ]}
            />

            <section className="page-section split-layout split-layout--auth">
                <section className="panel-card auth-side">
                    <h3 className="panel-card__title">Why verify?</h3>
                    {registeredEmail ? (
                        <div className="note-strip note-strip--soft">
                            <strong>Verification email</strong>
                            <span>We sent the verification step to {registeredEmail}.</span>
                        </div>
                    ) : null}
                    <div className="timeline">
                        <div className="timeline__item">It helps protect your account and confirms that your email is valid.</div>
                        <div className="timeline__item">It keeps account notices, bookings, and recovery messages going to the right inbox.</div>
                        <div className="timeline__item">It unlocks a smoother sign-in experience for future visits.</div>
                    </div>
                    <div className="panel-card__list">
                        <div className="mini-item">
                            <strong>After verification</strong>
                            <span>Return to login and continue into your account, bookings, and member features.</span>
                        </div>
                        <div className="mini-item">
                            <strong>Didn’t get the email?</strong>
                            <span>Use the form here to send another verification email to the same address.</span>
                        </div>
                    </div>
                </section>

                <div className="auth-form-wrap">
                    <DemoForm
                        variant="auth"
                        title="Resend verification email"
                        description="Enter the same email you used during signup."
                        submitLabel="Send again"
                        submittingLabel="Sending verification email..."
                        successMessage="Verification email sent."
                        idleMessage="Need another verification email? Request a new one here."
                        onSubmit={resendSignupVerification}
                        fields={[
                            {
                                name: 'email',
                                label: 'Email',
                                type: 'email',
                                placeholder: 'you@example.com',
                                required: true,
                                autoComplete: 'email',
                                full: true,
                            },
                        ]}
                    />
                </div>
            </section>
        </>
    );
}
