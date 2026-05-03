import { useEffect } from 'react';
import PageHero from '../../components/PageHero';
import { logoutAdmin } from '../../lib/adminAuth';

export default function AdminLogoutPage() {
    useEffect(() => {
        Promise.resolve(logoutAdmin()).catch((error) => {
            console.error('Admin sign-out failed:', error);
        });
    }, []);

    return (
        <>
            <PageHero
                eyebrow="Admin signed out"
                title="You have been signed out of the admin area."
                text="Sign in again anytime to continue managing appointments, deliveries, riders, and customer information."
                actions={[
                    { href: '/admin/login', label: 'Login again' },
                    { href: '/admin', label: 'View admin dashboard', variant: 'ghost' },
                ]}
            />
        </>
    );
}
