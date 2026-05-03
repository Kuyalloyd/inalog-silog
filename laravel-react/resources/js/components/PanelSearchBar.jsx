export default function PanelSearchBar({
    label = 'Search',
    placeholder = 'Search',
    value,
    onChange,
    hint = '',
    tone = 'default',
}) {
    return (
        <div className={`panel-search panel-search--${tone}`}>
            <div className="panel-search__top">
                <label className="panel-search__label">{label}</label>
                {hint ? <span className="panel-search__hint">{hint}</span> : null}
            </div>

            <div className="panel-search__control">
                <span className="panel-search__icon" aria-hidden="true">
                    Search
                </span>
                <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
                {value ? (
                    <button className="panel-search__clear" type="button" onClick={() => onChange('')}>
                        Clear
                    </button>
                ) : null}
            </div>
        </div>
    );
}
