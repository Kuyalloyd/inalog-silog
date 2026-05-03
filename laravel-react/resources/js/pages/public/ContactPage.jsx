import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';
import { contactDetails } from '../../data/siteData';

export default function ContactPage() {
    return (
        <>
            <PageHero
                eyebrow="Makipag-ugnayan"
                title="Abutin ang restaurant, events team, o guest support line."
                text="Makipag-ugnayan para sa tanong sa kainan, handaan, reservasyon, at suporta para sa bisita."
                actions={[
                    { href: '/bookings/event', label: 'Magtanong tungkol sa event' },
                    { href: '/menu', label: 'Tingnan ang menu', variant: 'ghost' },
                ]}
                stats={[
                    { value: 'Butuan City', label: 'Lokasyon sa Agusan del Norte' },
                    { value: '24/7', label: 'Tumatanggap ng inquiry' },
                    { value: '1', label: 'Sentrong contact point' },
                ]}
                images={['/assets/images/inalog-silog-logo.svg', '/assets/images/food1.png', '/assets/images/food2.png']}
            />

            <section className="page-section split-layout">
                <div className="panel-stack">
                    <section className="panel-card">
                        <h3 className="panel-card__title">Detalye ng restaurant</h3>
                        <div className="panel-card__list">
                            {contactDetails.map((detail) => (
                                <div className="mini-item" key={detail}>
                                    <span>{detail}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="note-strip">
                        <strong>Kailangan ng mabilis na sagot?</strong>
                        <span>Gamitin ang detalye sa ibaba o magpadala ng mensahe para malaman ng team kung paano ka tutulungan.</span>
                    </div>
                </div>

                <DemoForm
                    title="Magpadala ng inquiry"
                    description="Ipadala ang detalye mo at sabihin sa team kung ano ang kailangan mo."
                    submitLabel="Ipadala ang inquiry"
                    successMessage="Salamat. Handa nang suriin ang detalye ng iyong inquiry."
                    tableName="contact_inquiries"
                    prepareSubmission={(values) => ({
                        name: values.name,
                        email: values.email,
                        topic: values.topic,
                        message: values.message,
                        source_page: '/contact',
                    })}
                    fields={[
                        { name: 'name', label: 'Pangalan', placeholder: 'Iyong pangalan' },
                        { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
                        { name: 'topic', label: 'Paksa', type: 'select', options: ['Kainan', 'Handaan', 'Reservasyon', 'VIP', 'Suporta'] },
                        { name: 'message', label: 'Mensahe', type: 'textarea', placeholder: 'Sabihin sa team kung ano ang kailangan mo.', full: true },
                    ]}
                />
            </section>
        </>
    );
}
