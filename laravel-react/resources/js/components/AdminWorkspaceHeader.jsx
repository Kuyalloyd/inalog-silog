import { adminPanelStyle } from '../pages/admin/adminInlineStyles';

const copyStyle = {
    display: 'grid',
    gap: '1rem',
};

const headStyle = {
    ...adminPanelStyle,
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    alignItems: 'start',
};

const actionsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
};

const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.75rem',
    alignContent: 'start',
};

const statCardStyle = {
    padding: '1rem 1.05rem',
    borderRadius: '20px',
    background: '#f8fafc',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.7)',
};

export default function AdminWorkspaceHeader({ eyebrow, title, text, stats = [], actions = [] }) {
    return (
        <section className="admin-workspace__head" style={headStyle}>
            <div className="admin-workspace__copy" style={copyStyle}>
                <div>
                    <p className="admin-command__eyebrow">{eyebrow}</p>
                    <h1>{title}</h1>
                    <p>{text}</p>
                </div>

                {actions.length > 0 ? (
                    <div className="admin-workspace__actions" style={actionsStyle}>
                        {actions.map((action) =>
                            action.href ? (
                                <a
                                    className={action.variant === 'ghost' ? 'button-link--ghost' : 'button-link'}
                                    href={action.href}
                                    key={`${action.label}-${action.href}`}
                                >
                                    {action.label}
                                </a>
                            ) : (
                                <button
                                    className={action.variant === 'ghost' ? 'button-link--ghost' : 'button-link'}
                                    type="button"
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    key={action.label}
                                >
                                    {action.label}
                                </button>
                            ),
                        )}
                    </div>
                ) : null}
            </div>

            <aside className="admin-workspace__stats" style={statsStyle}>
                {stats.map((stat) => (
                    <div key={stat.label} style={statCardStyle}>
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                    </div>
                ))}
            </aside>
        </section>
    );
}
