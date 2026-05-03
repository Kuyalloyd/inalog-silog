export default function CardGrid({ items, className = '' }) {
    const gridClassName = className ? `card-grid ${className}` : 'card-grid';

    return (
        <div className={gridClassName}>
            {items.map((item) => (
                <article className="content-card" key={item.title}>
                    {item.image && (
                        <div className="content-card__image">
                            <img src={item.image} alt={item.title} />
                        </div>
                    )}

                    <div className="content-card__body">
                        {item.meta && <span className="content-card__meta">{item.meta}</span>}
                        <h3 className="content-card__title">{item.title}</h3>
                        <p className="content-card__text">{item.text}</p>
                        {item.link && (
                            <a className="content-card__link" href={item.link.href}>
                                {item.link.label}
                            </a>
                        )}
                    </div>
                </article>
            ))}
        </div>
    );
}
