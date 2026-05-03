import CardGrid from '../../components/CardGrid';
import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';
import { eventPackages } from '../../data/siteData';

export default function EventBookingPage() {
    return (
        <>
            <PageHero
                eyebrow="Handaan sa Event"
                title="Magplano ng kasal, birthday, launch, at masayang handaan ng pamilya."
                text="Sabihin sa team ang petsa, dami ng bisita, at istilo ng event para makapagsimula sa isang memorable na selebrasyon."
                actions={[
                    { href: '/contact', label: 'Makipag-usap sa team' },
                    { href: '/menu', label: 'Tingnan ang food categories', variant: 'ghost' },
                ]}
                stats={[
                    { value: '3', label: 'Uri ng package' },
                    { value: 'Custom', label: 'Madaling ipa-quote' },
                    { value: 'Flexible', label: 'Suporta sa plano' },
                ]}
            />

            <section className="page-section">
                <div className="section-heading">
                    <h2 className="section-heading__title">Mga package na puwedeng pagpilian</h2>
                    <p className="section-heading__text">
                        Tingnan ang ilang event directions para mahanap ang menu at serbisyong babagay sa handaan mo.
                    </p>
                </div>
                <CardGrid items={eventPackages.map((item) => ({ ...item, meta: 'Opsyon sa Package' }))} />
            </section>

            <section className="page-section">
                <DemoForm
                    title="Humingi ng quote para sa event"
                    description="Ibahagi ang basic details ng event para maihanda ng team ang tamang package para sa iyo."
                    submitLabel="Humingi ng quote"
                    successMessage="Salamat. Handa nang suriin ang detalye ng iyong event."
                    tableName="event_booking_requests"
                    prepareSubmission={(values) => ({
                        contact_name: values.name,
                        email: values.email,
                        event_type: values.eventType,
                        guest_count: Number(values.guestCount) || null,
                        target_date: values.date,
                        event_brief: values.brief,
                        source_page: '/bookings/event',
                    })}
                    fields={[
                        { name: 'name', label: 'Pangalan ng contact', placeholder: 'Pangalan ng planner o host' },
                        { name: 'email', label: 'Email', type: 'email', placeholder: 'host@example.com' },
                        { name: 'eventType', label: 'Uri ng event', type: 'select', options: ['Kasal', 'Birthday', 'Corporate', 'Community event'] },
                        { name: 'guestCount', label: 'Tinatayang bisita', placeholder: '80 to 150 bisita' },
                        { name: 'date', label: 'Target na petsa', type: 'date' },
                        { name: 'brief', label: 'Buod ng event', type: 'textarea', placeholder: 'Ibahagi ang style ng menu, oras, venue, at inaasahang serbisyo.', full: true },
                    ]}
                />
            </section>
        </>
    );
}
