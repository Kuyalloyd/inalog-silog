import { useEffect } from 'react';
import PageHero from '../../components/PageHero';
import { logoutMember } from '../../lib/memberAuth';

export default function LogoutPage() {
    useEffect(() => {
        logoutMember().catch((error) => {
            console.error('Supabase sign-out failed:', error);
        });
    }, []);

    return (
        <>
            <PageHero
                eyebrow="Signed out"
                title="You have been signed out."
                text="Sign back in anytime to continue with orders, bookings, and membership access."
                actions={[
                    { href: '/login', label: 'Sign in again' },
                    { href: '/', label: 'Back to home', variant: 'ghost' },
                ]}
            />
        </>
    );
}
