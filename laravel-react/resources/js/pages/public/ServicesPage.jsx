import CardGrid from '../../components/CardGrid';
import PageHero from '../../components/PageHero';
import { services } from '../../data/siteData';

export default function ServicesPage() {
    const heroImages = services.slice(0, 3).map((service) => service.image);

    return (
        <>
            <PageHero
                eyebrow="Serbisyong Pinoy"
                title="Mga alok na swak sa online food ordering at araw-araw na kainan."
                text="Mula padala at tracking hanggang customer panel, VIP benefits, at community food support, bawat serbisyo ay may mas mainit at mas Pinoy na dating."
                actions={[
                    { href: '/menu', label: 'Umorder ng pagkain' },
                    { href: '/track-order', label: 'I-track ang order', variant: 'ghost' },
                ]}
                stats={[
                    { value: '5', label: 'Serbisyong handa' },
                    { value: 'Live', label: 'Tracking flow' },
                    { value: 'Pinoy', label: 'Estilo ng serbisyo' },
                ]}
                images={heroImages}
            />

            <section className="page-section">
                <div className="section-heading">
                    <h2 className="section-heading__title">Piliin ang serbisyong akma sa lakad mo</h2>
                    <p className="section-heading__text">
                        Kung gutom ka, nagre-repeat order, o naghihintay ng delivery, may serbisyong nakaabang para sa iyo.
                    </p>
                </div>
                <CardGrid items={services} className="card-grid--services" />
            </section>
        </>
    );
}
