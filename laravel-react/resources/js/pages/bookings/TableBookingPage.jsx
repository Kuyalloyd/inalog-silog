import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';

const scheduleCards = [
    { title: 'Almusal', text: 'Magpareserba ng upuan para sa magaang morning service at mabilis na turnover.' },
    { title: 'Tanghalian', text: 'Pumili ng lunch slot para sa weekday meetups, working meals, at casual barkada sessions.' },
    { title: 'Hapunan', text: 'Magpareserba ng mesa para sa full-service evenings at mas mahabang stay.' },
];

export default function TableBookingPage() {
    return (
        <>
            <PageHero
                eyebrow="Reservasyon ng Mesa"
                title="Magpareserba ng almusal, tanghalian, o hapunan nang madali."
                text="Piliin ang gusto mong oras ng kainan at magpareserba ng mesa para sa casual meals, catch-up ng pamilya, at espesyal na okasyon."
                actions={[
                    { href: '/bookings/vip', label: 'Kailangan ng VIP seating?' },
                    { href: '/dashboard', label: 'Buksan ang dashboard', variant: 'ghost' },
                ]}
                stats={[
                    { value: '3', label: 'Oras ng reservasyon' },
                    { value: 'Flexible', label: 'Opsyon sa upuan' },
                    { value: 'Handa', label: 'Detalye ng reserba' },
                ]}
            />

            <section className="page-section split-layout">
                <section className="panel-card">
                    <h3 className="panel-card__title">Mga oras ng reservasyon</h3>
                    <div className="panel-card__list">
                        {scheduleCards.map((card) => (
                            <div className="mini-item" key={card.title}>
                                <strong>{card.title}</strong>
                                <span>{card.text}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <DemoForm
                    title="Magpareserba ng mesa"
                    description="Piliin ang gusto mong oras, seat code, at detalye ng bisita para maihanda ng team ang iyong reservasyon."
                    submitLabel="I-submit ang reserba"
                    successMessage="Salamat. Handa na para sa kumpirmasyon ang detalye ng iyong reservasyon."
                    tableName="table_bookings"
                    prepareSubmission={(values) => ({
                        booking_type: 'standard',
                        guest_name: values.name,
                        email: values.email,
                        service_window: values.service,
                        seat_code: values.seat,
                        booking_date: values.date,
                        booking_time: values.time,
                        source_page: '/bookings/table',
                    })}
                    fields={[
                        { name: 'name', label: 'Pangalan', placeholder: 'Pangalan ng bisita' },
                        { name: 'email', label: 'Email', type: 'email', placeholder: 'guest@inalogsilog.ph' },
                        { name: 'service', label: 'Oras ng serbisyo', type: 'select', options: ['Almusal', 'Tanghalian', 'Hapunan'] },
                        { name: 'seat', label: 'Seat code', placeholder: 'B1, L4, D2' },
                        { name: 'date', label: 'Petsa', type: 'date' },
                        { name: 'time', label: 'Oras', placeholder: '01:30 pm to 02:30 pm' },
                    ]}
                />
            </section>
        </>
    );
}
