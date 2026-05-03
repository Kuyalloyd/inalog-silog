import CardGrid from '../../components/CardGrid';
import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';
import { vipPerks } from '../../data/siteData';

export default function VipPage() {
    const vipCardDetails = [
        {
            image: '/assets/images/service2.png',
            text: 'Mas madali ang priority booking at mas mabilis ang kumpirmasyon para sa online orders at special requests mo.',
        },
        {
            image: '/assets/images/food1.png',
            text: 'Mas sulit ang bawat order dahil may espesyal na diskwento sa piling putahe, combos, at handaan picks.',
        },
        {
            image: '/assets/images/service4.png',
            text: 'May mas premium na setup para sa birthday, date night, at pribadong salu-salo na gusto ng mas tahimik na pwesto.',
        },
        {
            image: '/assets/images/food3.png',
            text: 'Mauna sa promos, seasonal dishes, at mabilis na suporta para sa mga suking gustong laging updated.',
        },
    ];

    const cards = vipPerks.map((perk, index) => ({
        meta: `Benepisyo 0${index + 1}`,
        title: perk,
        text: vipCardDetails[index]?.text || 'Sulitin ang mas premium na online food experience bilang VIP na miyembro.',
        image: vipCardDetails[index]?.image || '/assets/images/service4.png',
    }));

    return (
        <>
            <PageHero
                eyebrow="VIP membership"
                title="Sulitin ang benepisyo ng miyembro, priority tables, at espesyal na alok."
                text="Ang VIP membership ay para sa mga gustong mas madaling booking, exclusive promos, at mas premium na online food experience."
                actions={[
                    { href: '/bookings/vip', label: 'Magpareserba ng VIP table' },
                    { href: '/dashboard', label: 'Pumunta sa dashboard', variant: 'ghost' },
                ]}
                stats={[
                    { value: '4', label: 'Benepisyo ng miyembro' },
                    { value: 'Priority', label: 'Access sa booking' },
                    { value: 'Exclusive', label: 'Alok para sa miyembro' },
                ]}
                images={['/assets/images/vip/vip-icon.png', '/assets/images/food2.png', '/assets/images/food3.png']}
            />

            <section className="page-section">
                <CardGrid items={cards} className="card-grid--vip" />
            </section>

            <section className="page-section">
                <DemoForm
                    title="Mag-apply para sa membership"
                    description="Sabihin sa team kung aling membership plan ang bagay sa iyo at anong benepisyo ang pinakaimportante para sa iyo."
                    submitLabel="Mag-apply sa VIP"
                    successMessage="Salamat. Handa nang suriin ang detalye ng iyong interes sa membership."
                    tableName="vip_membership_applications"
                    prepareSubmission={(values) => ({
                        applicant_name: values.name,
                        email: values.email,
                        preferred_plan: values.plan,
                        notes: values.notes,
                        source_page: '/vip',
                    })}
                    fields={[
                        { name: 'name', label: 'Pangalan', placeholder: 'Pangalan ng bisita' },
                        { name: 'email', label: 'Email', type: 'email', placeholder: 'guest@inalogsilog.ph' },
                        { name: 'plan', label: 'Napupusuang plano', type: 'select', options: ['Buwan-buwan', 'Kada quarter', 'Taunan'] },
                        { name: 'notes', label: 'Tala', type: 'textarea', placeholder: 'Sabihin sa team kung anong klaseng VIP food experience ang gusto mo.', full: true },
                    ]}
                />
            </section>
        </>
    );
}
