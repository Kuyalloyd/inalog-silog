import PageHero from '../../components/PageHero';

export default function NotFoundPage({ rawPath }) {
    return (
        <>
            <PageHero
                eyebrow="Page not found"
                title="We could not find the page you were looking for."
                text={`The address ${rawPath} is not available right now. Try heading back home or opening the menu.`}
                actions={[
                    { href: '/', label: 'Go home' },
                    { href: '/menu', label: 'View the menu', variant: 'ghost' },
                ]}
            />
        </>
    );
}
