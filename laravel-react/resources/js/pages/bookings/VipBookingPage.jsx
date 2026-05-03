import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';

export default function VipBookingPage() {
    return (
        <>
            <PageHero
                eyebrow="VIP room booking"
                title="Reserve the premium setup with decor and more private dining."
                text="Choose a more private dining setup with decor options for celebrations, date nights, and premium gatherings."
                actions={[
                    { href: '/vip', label: 'See membership perks' },
                    { href: '/payment/vip', label: 'Preview VIP payment', variant: 'ghost' },
                ]}
                stats={[
                    { value: 'Private', label: 'Room-style dining' },
                    { value: 'Decor', label: 'Custom setup options' },
                    { value: 'VIP', label: 'Premium booking path' },
                ]}
            />

            <section className="page-section">
                <DemoForm
                    title="Book a VIP setup"
                    description="Select your room, decor style, and preferred dining window to prepare your VIP reservation."
                    submitLabel="Reserve VIP table"
                    successMessage="Thanks. Your VIP reservation details are ready for confirmation."
                    tableName="vip_bookings"
                    prepareSubmission={(values) => ({
                        guest_name: values.name,
                        email: values.email,
                        vip_section: values.room,
                        seat_code: values.seat,
                        decor_option: values.decor,
                        booking_date: values.date,
                        booking_time: values.time,
                        source_page: '/bookings/vip',
                    })}
                    fields={[
                        { name: 'name', label: 'Name', placeholder: 'Guest name' },
                        { name: 'email', label: 'Email', type: 'email', placeholder: 'guest@inalogsilog.ph' },
                        { name: 'room', label: 'VIP section', type: 'select', options: ['Window room', 'Family room', 'Private dining room'] },
                        { name: 'seat', label: 'Seat code', placeholder: 'V1, V2, V3' },
                        { name: 'decor', label: 'Decor option', type: 'select', options: ['Classic', 'Birthday', 'Date night', 'Minimal'] },
                        { name: 'date', label: 'Date', type: 'date' },
                        { name: 'time', label: 'Time', placeholder: '06:00 pm to 08:00 pm' },
                    ]}
                />
            </section>
        </>
    );
}
