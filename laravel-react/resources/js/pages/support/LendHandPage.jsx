import CardGrid from '../../components/CardGrid';
import DemoForm from '../../components/DemoForm';
import PageHero from '../../components/PageHero';
import { donationHighlights } from '../../data/siteData';

export default function LendHandPage() {
    return (
        <>
            <PageHero
                eyebrow="Lend a hand"
                title="Suportahan ang food outreach at community care sa pamamagitan ng programa."
                text="Tumutulong ang Lend a Hand na makapaghatid ng pagkain, pantry support, at praktikal na tulong sa mga higit na nangangailangan."
                actions={[
                    { href: '/contact', label: 'Maki-partner sa team' },
                    { href: '/menu', label: 'Tumulong sa pamamagitan ng kainan', variant: 'ghost' },
                ]}
                stats={[
                    { value: '3', label: 'Tuon ng donasyon' },
                    { value: 'Komunidad', label: 'Iisang misyon' },
                    { value: 'Tulong', label: 'Programa ng suporta' },
                ]}
            />

            <section className="page-section">
                <CardGrid items={donationHighlights.map((item, index) => ({ ...item, meta: `Programa 0${index + 1}` }))} />
            </section>

            <section className="page-section">
                <DemoForm
                    title="Mangakong tumulong"
                    description="Sabihin sa team kung paano ka gustong tumulong at anong klaseng suporta ang nais mong ibigay."
                    submitLabel="I-submit ang tulong"
                    successMessage="Salamat. Handa nang suriin ang detalye ng iyong suporta."
                    tableName="donation_pledges"
                    prepareSubmission={(values) => ({
                        supporter_name: values.name,
                        email: values.email,
                        amount: Number(String(values.amount).replace(/[^\d.]/g, '')) || null,
                        notes: values.notes,
                        source_page: '/lend-hand',
                    })}
                    fields={[
                        { name: 'name', label: 'Pangalan', placeholder: 'Pangalan ng tagasuporta' },
                        { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
                        { name: 'amount', label: 'Halaga', placeholder: 'PHP 1000' },
                        { name: 'notes', label: 'Tala', type: 'textarea', placeholder: 'Sabihin sa team kung paano ka gustong tumulong.', full: true },
                    ]}
                />
            </section>
        </>
    );
}
