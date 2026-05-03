export default function PageHero({ eyebrow, title, text, actions = [], stats = [], images = [] }) {
    const defaultImages = [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Chicken%20inasal%20with%20rice.jpg',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Buttered%20Shrimp%2001.jpg',
        'https://commons.wikimedia.org/wiki/Special:FilePath/BULALO.jpg',
    ];

    const imageSet = images.length ? images : defaultImages;

    return (
        <section className="page-section">
            <div className="page-hero">
                <div className="page-hero__copy">
                    <p className="eyebrow">{eyebrow}</p>
                    <h1 className="page-hero__title">{title}</h1>
                    <p className="page-hero__text">{text}</p>

                    {actions.length > 0 && (
                        <div className="page-hero__actions">
                            {actions.map((action) => (
                                <a
                                    key={`${action.href}-${action.label}`}
                                    className={action.variant === 'ghost' ? 'button-link--ghost' : 'button-link'}
                                    href={action.href}
                                >
                                    {action.label}
                                </a>
                            ))}
                        </div>
                    )}

                    {stats.length > 0 && (
                        <div className="stats-row">
                            {stats.map((stat) => (
                                <div className="stat-card" key={stat.label}>
                                    <strong>{stat.value}</strong>
                                    <span>{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="hero-visual" aria-hidden="true">
                    <span className="hero-visual__orb hero-visual__orb--one" />
                    <span className="hero-visual__orb hero-visual__orb--two" />

                    <figure className="hero-visual__plate hero-visual__plate--one">
                        <img src={imageSet[0]} alt="" />
                    </figure>
                    <figure className="hero-visual__plate hero-visual__plate--two">
                        <img src={imageSet[1] || imageSet[0]} alt="" />
                    </figure>
                    <figure className="hero-visual__plate hero-visual__plate--three">
                        <img src={imageSet[2] || imageSet[0]} alt="" />
                    </figure>

                    <div className="hero-visual__tag hero-visual__tag--top">Sariwang pagkaing Pinoy</div>
                    <div className="hero-visual__tag hero-visual__tag--bottom">Para sa online order at delivery</div>
                </div>
            </div>
        </section>
    );
}
