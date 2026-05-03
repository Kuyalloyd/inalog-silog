import PageHero from '../../components/PageHero';
import {
    legacyPhpActionMap,
    legacyPhpPageMap,
    legacyPhpSharedMap,
    legacyPhpTotals,
    legacyPhpTrackedTotal,
    legacyPhpVendorMap,
} from '../../data/legacyPhpMap';

function MigrationSection({ title, description, items, statusTone = 'green', statusKey, metaLabel }) {
    return (
        <section className="panel-card">
            <h3 className="panel-card__title">{title}</h3>
            <p className="form-card__text">{description}</p>
            <div className="table-list">
                {items.map((item) => (
                    <div className="table-list__row" key={item.php}>
                        <div>
                            <strong>{item.php}</strong>
                            <div className="table-list__meta">{item.note}</div>
                        </div>
                        <span className={`table-list__status table-list__status--${statusTone}`}>
                            {item[statusKey]}
                            {metaLabel && item[metaLabel] ? ` (${item[metaLabel]})` : ''}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function MigrationMapPage() {
    return (
        <>
            <PageHero
                eyebrow="Migration map"
                title="Every legacy PHP file is now accounted for in the React and Laravel migration."
                text="JSX replaces the old page templates and shared layout fragments. Form handlers, auth checks, mailers, PDF utilities, and framework bootstrap code stay server-side and should move into Laravel controllers, middleware, services, or Composer packages."
                actions={[
                    { href: '/', label: 'Open the new app' },
                    { href: '/dashboard', label: 'Open customer panel', variant: 'ghost' },
                ]}
                stats={[
                    { value: `${legacyPhpTrackedTotal}`, label: 'Legacy PHP files tracked' },
                    { value: `${legacyPhpTotals.pages}`, label: 'Page PHP files mapped to JSX' },
                    { value: `${legacyPhpTotals.actions}`, label: 'Backend actions mapped to Laravel' },
                    { value: `${legacyPhpTotals.shared + legacyPhpTotals.vendor}`, label: 'Shared or vendor PHP kept server-side' },
                ]}
            />

            <section className="page-section dashboard-grid">
                <MigrationSection
                    title="PHP pages converted to JSX routes"
                    description="These are the actual screen files that now belong in React page components."
                    items={legacyPhpPageMap.map((item) => ({
                        ...item,
                        note: 'Now rendered from a React page component.',
                    }))}
                    statusKey="jsxRoute"
                    statusTone="green"
                />

                <MigrationSection
                    title="Backend handlers that become Laravel actions"
                    description="These files handled submissions, deletes, toggles, and downloads. They should move into controllers or service classes instead of React."
                    items={legacyPhpActionMap}
                    statusKey="laravelTarget"
                    statusTone="gold"
                />
            </section>

            <section className="page-section dashboard-grid">
                <MigrationSection
                    title="Shared PHP modules to replace with framework structure"
                    description="These files provided session checks, includes, and connection helpers. They are not JSX pages, but they are now mapped into the Laravel app structure."
                    items={legacyPhpSharedMap}
                    statusKey="laravelTarget"
                    statusTone="ink"
                />

                <MigrationSection
                    title="Vendor PHP that stays server-side"
                    description="These are third-party mail and PDF libraries. They should remain backend dependencies or be replaced with Composer-managed Laravel integrations."
                    items={legacyPhpVendorMap}
                    statusKey="laravelTarget"
                    statusTone="gold"
                    metaLabel="fileCount"
                />
            </section>
        </>
    );
}
