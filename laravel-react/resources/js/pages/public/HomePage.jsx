import { getFeaturedMenuItems } from '../../data/menuData';
import { accessPanels, customerSegments, digitalAccessHighlights, websiteInterfaces } from '../../data/siteData';

const actionCards = [
    { title: 'Order meals', text: 'Menu, basket, checkout, and tracking.', href: '/menu' },
    { title: 'Fast checkout', text: 'Delivery details and payment in one flow.', href: '/checkout' },
    { title: 'Track delivery', text: 'Customer tracker and rider route panel.', href: '/track-order' },
    { title: 'Customer panel', text: 'Orders, favorites, profile, and reorder tools.', href: '/dashboard' },
];

const panelSummaries = {
    'Guest and customer entry': 'Browse the restaurant site and start an order.',
    'Customer dashboard': 'Handle orders, favorites, and account details.',
    'Membership and premium access': 'Open loyalty perks and faster service tools.',
    'Delivery route and drop-off view': 'Use the rider map, queue, and stop details.',
};

export default function HomePage() {
    const featuredItems = getFeaturedMenuItems();
    const heroItems = featuredItems.slice(0, 3);
    const signatureItems = featuredItems.slice(0, 4);
    const panelCards = accessPanels.slice(0, 5);
    const interfaceTitles = websiteInterfaces.slice(0, 6);

    return (
        <>
            <section className="page-section landing-page__section">
                <div className="landing-hero landing-hero--studio">
                    <div className="landing-hero__copy landing-hero__copy--studio">
                        <div>
                            <p className="landing-hero__eyebrow">Inalog Silog digital restaurant</p>
                            <h1 className="landing-hero__title">Filipino comfort food, easier to order.</h1>
                            <p className="landing-hero__text">
                                Order silog meals, checkout faster, and track delivery from one clean food platform.
                            </p>
                        </div>

                        <div className="landing-hero__actions">
                            <a className="button-link" href="/menu">
                                Order now
                            </a>
                            <a className="button-link--ghost" href="/track-order">
                                Track order
                            </a>
                        </div>

                        <div className="landing-hero__stats landing-hero__stats--studio">
                            <div>
                                <strong>Web based</strong>
                                <span>Desktop and browser ordering</span>
                            </div>
                            <div>
                                <strong>Phone ready</strong>
                                <span>Smooth on cellphone screens</span>
                            </div>
                            <div>
                                <strong>4 panels</strong>
                                <span>Public, customer, VIP, rider</span>
                            </div>
                        </div>
                    </div>

                    <div className="landing-photo-wall" aria-hidden="true">
                        <article className="landing-photo-card landing-photo-card--hero">
                            <img src={heroItems[0]?.image} alt="" />
                            <div className="landing-photo-card__body">
                                <span>{heroItems[0]?.badge || 'Signature dish'}</span>
                                <strong>{heroItems[0]?.name || 'Featured meal'}</strong>
                                <p>Made for repeat orders, clean checkout, and fast delivery.</p>
                            </div>
                        </article>

                        {heroItems.slice(1).map((item) => (
                            <article className="landing-photo-card landing-photo-card--mini" key={item.name}>
                                <img src={item.image} alt="" />
                                <div className="landing-photo-card__body">
                                    <span>Featured</span>
                                    <strong>{item.name}</strong>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="page-section landing-page__section">
                <div className="landing-section-heading landing-section-heading--compact">
                    <div>
                        <p className="landing-section-heading__eyebrow">What the website does</p>
                        <h2>Built around the actual customer flow.</h2>
                    </div>
                </div>

                <div className="landing-action-grid">
                    {actionCards.map((card) => (
                        <a className="landing-action-card" href={card.href} key={card.title}>
                            <strong>{card.title}</strong>
                            <span>{card.text}</span>
                        </a>
                    ))}
                </div>
            </section>

            <section className="page-section landing-page__section">
                <div className="landing-section-heading">
                    <div>
                        <p className="landing-section-heading__eyebrow">Separate workspaces</p>
                        <h2>Every role gets its own panel.</h2>
                    </div>
                    <p>Cleaner entry points for customers and riders instead of one mixed website shell.</p>
                </div>

                <div className="landing-panel-grid landing-panel-grid--compact">
                    {panelCards.map((panel, index) => (
                        <article className="landing-panel-card landing-panel-card--compact" key={panel.title}>
                            <span className="landing-panel-card__index">0{index + 1}</span>
                            <p className="landing-panel-card__meta">{panel.meta}</p>
                            <h3>{panel.title}</h3>
                            <p>{panelSummaries[panel.title] || panel.text}</p>
                            <a href={panel.link.href}>{panel.link.label}</a>
                        </article>
                    ))}
                </div>
            </section>

            <section className="page-section landing-page__section">
                <div className="landing-section-heading">
                    <div>
                        <p className="landing-section-heading__eyebrow">Signature dishes</p>
                        <h2>Matching food visuals for the homepage.</h2>
                    </div>
                    <p>A more consistent food-focused look instead of mixing unrelated images.</p>
                </div>

                <div className="landing-signature-grid">
                    {signatureItems.map((item) => (
                        <article className="landing-signature-card" key={item.name}>
                            <img src={item.image} alt={item.name} />
                            <div className="landing-signature-card__body">
                                <span>{item.badge}</span>
                                <strong>{item.name}</strong>
                                <p>PHP {item.price}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="page-section landing-page__section">
                <div className="landing-smart-grid">
                    <section className="landing-smart-card">
                        <p className="landing-section-heading__eyebrow">Built for your startup idea</p>
                        <h2>Made for students, families, tourists, and busy customers.</h2>
                        <div className="landing-audience-chips">
                            {customerSegments.map((segment) => (
                                <span className="landing-audience-chip" key={segment.title}>
                                    {segment.meta}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section className="landing-smart-card landing-smart-card--soft">
                        <p className="landing-section-heading__eyebrow">System coverage</p>
                        <h2>Web, phone, delivery, and loyalty.</h2>
                        <div className="landing-list-grid">
                            {digitalAccessHighlights.map((item) => (
                                <div className="landing-list-item" key={item.title}>
                                    <strong>{item.title}</strong>
                                    <span>{item.link.label}</span>
                                </div>
                            ))}
                            {interfaceTitles.slice(0, 3).map((item) => (
                                <div className="landing-list-item" key={item.title}>
                                    <strong>{item.title}</strong>
                                    <span>{item.meta}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </section>
        </>
    );
}
