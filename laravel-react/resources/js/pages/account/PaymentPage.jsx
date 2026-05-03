import PageHero from '../../components/PageHero';

export default function PaymentPage({ currentPath }) {
    const isVip = currentPath === '/payment/vip';

    return (
        <>
            <PageHero
                eyebrow={isVip ? 'VIP payment verification' : 'Payment verification'}
                title={isVip ? 'Confirm premium dining payment details.' : 'Confirm order payment details before release.'}
                text="Review payment details carefully before confirming your order or VIP booking."
                actions={[
                    { href: isVip ? '/bookings/vip' : '/checkout', label: 'Back to previous step' },
                    { href: '/dashboard', label: 'Open dashboard', variant: 'ghost' },
                ]}
                stats={[
                    { value: isVip ? 'VIP' : 'Order', label: 'Payment context' },
                    { value: 'Check', label: 'Confirmation step' },
                    { value: 'Guest', label: 'Payment review' },
                ]}
            />

            <section className="page-section dashboard-grid">
                <section className="panel-card">
                    <h3 className="panel-card__title">Verification checklist</h3>
                    <div className="timeline">
                        <div className="timeline__item">Collect payment reference and payer details.</div>
                        <div className="timeline__item">Match the amount to order or booking totals.</div>
                        <div className="timeline__item">Keep proof of payment ready if the team needs to confirm the transfer.</div>
                        <div className="timeline__item">Watch for confirmation before expecting release or booking approval.</div>
                    </div>
                </section>

                <section className="panel-card">
                    <h3 className="panel-card__title">Before you continue</h3>
                    <div className="panel-card__list">
                        <div className="mini-item">
                            <strong>Reference details</strong>
                            <span>Make sure the payment reference, amount, and booking or order details match correctly.</span>
                        </div>
                        <div className="mini-item">
                            <strong>Guest contact</strong>
                            <span>Use an active email or phone number so the team can reach you if anything needs verification.</span>
                        </div>
                    </div>
                </section>
            </section>
        </>
    );
}
