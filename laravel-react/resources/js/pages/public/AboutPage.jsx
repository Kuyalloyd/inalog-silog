import CardGrid from '../../components/CardGrid';
import PageHero from '../../components/PageHero';
import { aboutSections } from '../../data/siteData';

export default function AboutPage() {
    return (
        <>
            <PageHero
                eyebrow="Tungkol sa Inalog Silog"
                title="Isang mainit na kwento ng tatak na nakaugat sa pagkaing Pinoy."
                text="Pinagsasama ng Inalog Silog ang masaganang plato, pamilyar na lasa, at maaliwalas na serbisyo para sa araw-araw na kainan at espesyal na salu-salo."
                actions={[
                    { href: '/services', label: 'Tingnan ang mga serbisyo' },
                    { href: '/contact', label: 'Makipag-ugnayan', variant: 'ghost' },
                ]}
                stats={[
                    { value: '4', label: 'Bahagi ng kwento' },
                    { value: 'Butuan City', label: 'Pinagmulan' },
                    { value: 'Bisita muna', label: 'Pangako sa serbisyo' },
                ]}
                images={['/assets/images/about-image.jpg', '/assets/images/about3.png', '/assets/images/about4.png']}
            />

            <section className="page-section">
                <div className="section-heading">
                    <h2 className="section-heading__title">Misyon, kasaysayan, at pangako sa bisita</h2>
                    <p className="section-heading__text">
                        Kilalanin ang kusina, ang kwento sa likod ng brand, at ang uri ng serbisyong maaasahan ng mga bisita.
                    </p>
                </div>
                <CardGrid items={aboutSections} />
            </section>
        </>
    );
}
