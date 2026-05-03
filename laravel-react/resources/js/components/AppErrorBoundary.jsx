import { Component } from 'react';

export default class AppErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error) {
        console.error('React route render failed:', error);
    }

    render() {
        if (this.state.error) {
            return (
                <section className="page-section">
                    <div className="panel-card route-state">
                        <p className="eyebrow">Something went wrong</p>
                        <h1 className="panel-card__title">This page ran into a problem.</h1>
                        <p className="form-card__text">
                            Please reload the page or return home and try again.
                        </p>
                        <div className="page-hero__actions">
                            <a className="button-link" href="/">
                                Back to home
                            </a>
                            <button
                                className="button-link--ghost"
                                type="button"
                                onClick={() => window.location.reload()}
                            >
                                Reload page
                            </button>
                        </div>
                    </div>
                </section>
            );
        }

        return this.props.children;
    }
}
