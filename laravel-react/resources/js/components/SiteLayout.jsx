import { useEffect, useState } from 'react';
import InstallAppBanner from './InstallAppBanner';
import { useCart } from '../context/CartContext';
import { getFirstName } from '../lib/formatting';
import { readAdminSession } from '../lib/adminAuth';
import { readRiderSession } from '../lib/riderSession';
import { supabase } from '../lib/supabaseClient';

const publicNavLinks = [
    { label: 'Simula', href: '/' },
    { label: 'Tungkol', href: '/about' },
    { label: 'Serbisyo', href: '/services' },
    { label: 'Menu', href: '/menu' },
    { label: 'Ugnayan', href: '/contact' },
    { label: 'Track', href: '/track-order' },
    { label: 'VIP', href: '/vip' },
];

const accountNavLinks = [
    { label: 'Home', href: '/dashboard', activePath: '/dashboard', exactOnly: true },
    { label: 'Food', href: '/dashboard/menu', activePath: '/dashboard/menu' },
    { label: 'Orders', href: '/dashboard/orders', activePath: '/dashboard/orders' },
    { label: 'Favorites', href: '/dashboard/favorites', activePath: '/dashboard/favorites' },
    { label: 'Profile', href: '/dashboard/account', activePath: '/dashboard/account' },
];

const riderNavLinks = [
    { label: 'Dispatch', href: '/rider', activePath: '/rider', exactOnly: true },
    { label: 'Map', href: '/rider/map', activePath: '/rider/map' },
    { label: 'Orders', href: '/rider/queue', activePath: '/rider/queue' },
    { label: 'Shift', href: '/rider/shift', activePath: '/rider/shift' },
];

const adminNavLinks = [
    { label: 'Overview', href: '/admin', activePath: '/admin', exactOnly: true },
    { label: 'Bookings', href: '/admin/appointments', activePath: '/admin/appointments' },
    { label: 'Deliveries', href: '/admin/deliveries', activePath: '/admin/deliveries' },
    { label: 'Customers', href: '/admin/customers', activePath: '/admin/customers' },
    { label: 'Riders', href: '/admin/riders', activePath: '/admin/riders' },
];

const footerLinks = [
    { label: 'Menu', href: '/menu' },
    { label: 'Track Order', href: '/track-order' },
    { label: 'Customer Panel', href: '/dashboard' },
    { label: 'VIP', href: '/vip' },
    { label: 'Ugnayan', href: '/contact' },
];

function isActive(currentPath, targetPath, exactOnly = false) {
    if (targetPath === '/') {
        return currentPath === '/';
    }

    if (exactOnly) {
        return currentPath === targetPath;
    }

    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function getNavLinkClass(baseClassName, currentPath, link) {
    if (link.disableActive) {
        return baseClassName;
    }

    const targetPath = link.activePath || link.href;

    return isActive(currentPath, targetPath, link.exactOnly) ? `${baseClassName} ${baseClassName}--active` : baseClassName;
}

function getLayoutMode(currentPath) {
    if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
        return 'admin';
    }

    if (currentPath.startsWith('/rider')) {
        return 'rider';
    }

    if (
        currentPath === '/dashboard' ||
        currentPath.startsWith('/dashboard/') ||
        currentPath === '/checkout' ||
        currentPath === '/track-order' ||
        currentPath.startsWith('/payment')
    ) {
        return 'account';
    }

    return 'public';
}

function BrandBlock({ href, eyebrow, name }) {
    return (
        <a className="brand" href={href}>
            <span className="brand__mark">
                <img src="/assets/images/inalog-silog-logo.svg" alt="Inalog Silog logo" />
            </span>
            <span className="brand__copy">
                <p className="brand__eyebrow">{eyebrow}</p>
                <p className="brand__name">{name}</p>
            </span>
        </a>
    );
}

function ToggleButton({ menuOpen, onClick }) {
    return (
        <button className={menuOpen ? 'nav-toggle nav-toggle--open' : 'nav-toggle'} type="button" aria-label="Buksan ang nabigasyon" aria-expanded={menuOpen} onClick={onClick}>
            <span />
            <span />
            <span />
        </button>
    );
}

function PublicHeader({ currentPath, menuOpen, onToggleMenu, onCloseMenu, hasSession, itemCount }) {
    return (
        <div className="site-header__inner">
            <BrandBlock href="/" eyebrow="Pagkaing Pinoy na may ginhawa" name="Inalog Silog" />

            <ToggleButton menuOpen={menuOpen} onClick={onToggleMenu} />

            <nav className={`nav ${menuOpen ? 'nav--open' : ''}`}>
                {publicNavLinks.map((link) => (
                    <a key={link.href} className={getNavLinkClass('nav__link', currentPath, link)} href={link.href} onClick={onCloseMenu}>
                        {link.label}
                    </a>
                ))}

                <div className="nav__mobile-tools">
                    <a className="nav__mobile-pill" href="/checkout" onClick={onCloseMenu}>
                        Basket
                        <span>{itemCount}</span>
                    </a>
                    {hasSession ? (
                        <a className="nav__mobile-pill nav__mobile-pill--brand" href="/dashboard" onClick={onCloseMenu}>
                            Dashboard
                        </a>
                    ) : (
                        <>
                            <a className="nav__mobile-pill" href="/register" onClick={onCloseMenu}>
                                Register
                            </a>
                            <a className="nav__mobile-pill nav__mobile-pill--brand" href="/login" onClick={onCloseMenu}>
                                Mag-login
                            </a>
                        </>
                    )}
                </div>
            </nav>

            <div className="header-actions">
                <a className="button-link--ghost header-cart-link" href="/checkout">
                    Basket
                    <span className="header-cart-link__count">{itemCount}</span>
                </a>
                {hasSession ? (
                    <a className="button-link" href="/dashboard">
                        Dashboard
                    </a>
                ) : (
                    <>
                        <a className="button-link--ghost" href="/register">
                            Register
                        </a>
                        <a className="button-link" href="/login">
                            Mag-login
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}

function AccountHeader({ currentPath, menuOpen, onToggleMenu, onCloseMenu, hasSession, firstName, itemCount }) {
    return (
        <div className="site-header__inner site-header__inner--stacked">
            <div className="workspace-header__top workspace-header__top--account">
                <BrandBlock href="/dashboard" eyebrow="Customer member area" name="Inalog Silog Account" />

                <div className="workspace-header__tools">
                    <div className="workspace-account-status">
                        <span className="workspace-account-status__eyebrow">{hasSession ? 'Signed in' : 'Customer panel'}</span>
                        <strong>{hasSession ? firstName : 'Guest access'}</strong>
                    </div>
                    <div className="workspace-header__actions">
                        <a className="workspace-header__utility header-cart-link" href="/checkout">
                            Basket
                            <span className="header-cart-link__count">{itemCount}</span>
                        </a>
                        <a className="workspace-header__utility" href="/track-order">
                            Track
                        </a>
                        <a className="workspace-header__primary" href={hasSession ? '/logout' : '/login'}>
                            {hasSession ? 'Mag-logout' : 'Mag-login'}
                        </a>
                    </div>
                    <ToggleButton menuOpen={menuOpen} onClick={onToggleMenu} />
                </div>
            </div>

            <div className={menuOpen ? 'workspace-nav workspace-nav--open' : 'workspace-nav'}>
                <div className="workspace-nav__links">
                    {accountNavLinks.map((link) => (
                        <a key={link.href} className={getNavLinkClass('workspace-nav__link', currentPath, link)} href={link.href} onClick={onCloseMenu}>
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="workspace-nav__mobile-tools">
                    <a className="nav__mobile-pill" href="/checkout" onClick={onCloseMenu}>
                        Basket
                        <span>{itemCount}</span>
                    </a>
                    <a className="nav__mobile-pill" href="/track-order" onClick={onCloseMenu}>
                        Track Order
                    </a>
                    <a className="nav__mobile-pill nav__mobile-pill--brand" href={hasSession ? '/logout' : '/login'} onClick={onCloseMenu}>
                        {hasSession ? 'Mag-logout' : 'Mag-login'}
                    </a>
                </div>
            </div>
        </div>
    );
}

function RiderHeader({ currentPath, menuOpen, onToggleMenu, onCloseMenu, riderSession }) {
    const riderLabel = riderSession?.riderName || 'Rider access';

    return (
        <div className="site-header__inner site-header__inner--stacked">
            <div className="route-header__top">
                <BrandBlock href="/rider" eyebrow="Delivery route workspace" name="Inalog Silog Rider" />

                <div className="route-header__actions">
                    <span className="route-header__status">{riderSession ? `${riderLabel} on shift` : 'Rider sign-in'}</span>
                    <div className="route-header__desktop-actions">
                        {riderSession ? (
                            <>
                                <a className="button-link--ghost" href="/rider/queue">
                                    Orders
                                </a>
                                <a className="button-link--ghost" href="/rider/map">
                                    Map
                                </a>
                                <a className="button-link" href="/logout">
                                    Logout
                                </a>
                            </>
                        ) : (
                            <>
                                <a className="button-link--ghost" href="/rider/shift">
                                    Shift
                                </a>
                                <a className="button-link" href="/rider">
                                    Rider Login
                                </a>
                            </>
                        )}
                    </div>
                    <ToggleButton menuOpen={menuOpen} onClick={onToggleMenu} />
                </div>
            </div>

            <div className={menuOpen ? 'route-header__bar route-header__bar--open' : 'route-header__bar'}>
                <div className="route-header__links">
                    {riderNavLinks.map((link) => (
                        <a key={link.href} className={getNavLinkClass('route-header__link', currentPath, link)} href={link.href} onClick={onCloseMenu}>
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="route-header__mobile-tools">
                    <a className="nav__mobile-pill" href="/rider" onClick={onCloseMenu}>
                        {riderSession ? 'Dispatch' : 'Rider Login'}
                    </a>
                    <a className="nav__mobile-pill" href="/rider/map" onClick={onCloseMenu}>
                        Map
                    </a>
                    <a className="nav__mobile-pill nav__mobile-pill--brand" href={riderSession ? '/logout' : '/rider/shift'} onClick={onCloseMenu}>
                        {riderSession ? 'Logout' : 'Shift'}
                    </a>
                </div>
            </div>
        </div>
    );
}

function AdminHeader({ currentPath, menuOpen, onToggleMenu, onCloseMenu, adminSession, adminProfileOpen, onToggleAdminProfile, onCloseAdminProfile }) {
    const adminLabel = adminSession?.name || 'Admin access';
    const adminEmail = adminSession?.email || 'Sign in required';
    const adminTriggerLabel = 'Admin';
    const adminInitial = 'A';

    function handleProfileAction() {
        onCloseMenu();
        onCloseAdminProfile();
    }

    return (
        <div className="site-header__inner site-header__inner--stacked">
            <div className="admin-topbar">
                <BrandBlock href="/admin" eyebrow="Website operations panel" name="Inalog Silog Admin" />

                <nav className={menuOpen ? 'admin-topbar__nav admin-topbar__nav--open' : 'admin-topbar__nav'}>
                    <p className="admin-topbar__label">Admin navigation</p>

                    <div className="admin-topbar__links">
                        {adminNavLinks.map((link) => (
                            <a
                                key={link.href}
                                className={getNavLinkClass('admin-topbar__link', currentPath, link)}
                                href={link.href}
                                onClick={handleProfileAction}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </nav>

                <div className="admin-topbar__tools">
                    <div className="admin-topbar__profile">
                        <button
                            className={adminProfileOpen ? 'admin-topbar__profile-trigger admin-topbar__profile-trigger--open' : 'admin-topbar__profile-trigger'}
                            type="button"
                            aria-expanded={adminProfileOpen}
                            aria-label="Open admin menu"
                            onClick={onToggleAdminProfile}
                        >
                            <span className="admin-topbar__profile-avatar">{adminInitial || 'A'}</span>
                            <span className="admin-topbar__profile-copy">
                                <strong>{adminTriggerLabel}</strong>
                            </span>
                            <span className="admin-topbar__profile-caret">v</span>
                        </button>

                        {adminProfileOpen ? (
                            <div className="admin-topbar__profile-menu">
                                <div className="admin-topbar__profile-summary">
                                    <strong>{adminLabel}</strong>
                                    <span>{adminEmail}</span>
                                </div>

                                {adminSession ? (
                                    <>
                                        <a className="admin-topbar__profile-item" href="/admin" onClick={handleProfileAction}>
                                            Open dashboard
                                        </a>
                                        <a className="admin-topbar__profile-item" href="/" onClick={handleProfileAction}>
                                            View website
                                        </a>
                                        <a className="admin-topbar__profile-item admin-topbar__profile-item--danger" href="/admin/logout" onClick={handleProfileAction}>
                                            Admin logout
                                        </a>
                                    </>
                                ) : (
                                    <>
                                        <a className="admin-topbar__profile-item" href="/admin/login" onClick={handleProfileAction}>
                                            Admin login
                                        </a>
                                        <a className="admin-topbar__profile-item" href="/" onClick={handleProfileAction}>
                                            View website
                                        </a>
                                    </>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <ToggleButton menuOpen={menuOpen} onClick={onToggleMenu} />
                </div>
            </div>
        </div>
    );
}

function renderHeaderByMode({
    currentPath,
    layoutMode,
    menuOpen,
    onToggleMenu,
    onCloseMenu,
    hasSession,
    firstName,
    itemCount,
    riderSession,
    adminSession,
    adminProfileOpen,
    onToggleAdminProfile,
    onCloseAdminProfile,
}) {
    if (layoutMode === 'admin') {
        return (
            <AdminHeader
                currentPath={currentPath}
                menuOpen={menuOpen}
                onToggleMenu={onToggleMenu}
                onCloseMenu={onCloseMenu}
                adminSession={adminSession}
                adminProfileOpen={adminProfileOpen}
                onToggleAdminProfile={onToggleAdminProfile}
                onCloseAdminProfile={onCloseAdminProfile}
            />
        );
    }

    if (layoutMode === 'account') {
        return (
            <AccountHeader
                currentPath={currentPath}
                menuOpen={menuOpen}
                onToggleMenu={onToggleMenu}
                onCloseMenu={onCloseMenu}
                hasSession={hasSession}
                firstName={firstName}
                itemCount={itemCount}
            />
        );
    }

    if (layoutMode === 'rider') {
        return (
            <RiderHeader
                currentPath={currentPath}
                menuOpen={menuOpen}
                onToggleMenu={onToggleMenu}
                onCloseMenu={onCloseMenu}
                riderSession={riderSession}
            />
        );
    }

    return (
        <PublicHeader
            currentPath={currentPath}
            menuOpen={menuOpen}
            onToggleMenu={onToggleMenu}
            onCloseMenu={onCloseMenu}
            hasSession={hasSession}
            itemCount={itemCount}
        />
    );
}

export default function SiteLayout({ currentPath, children }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [member, setMember] = useState(null);
    const [adminSession, setAdminSession] = useState(() => readAdminSession());
    const [adminProfileOpen, setAdminProfileOpen] = useState(false);
    const [riderSession, setRiderSession] = useState(() => readRiderSession());
    const { itemCount } = useCart();

    useEffect(() => {
        if (!supabase) {
            return undefined;
        }

        let isMounted = true;

        supabase.auth.getSession().then(({ data }) => {
            if (isMounted) {
                setMember(data.session?.user ?? null);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setMember(session?.user ?? null);
            setMenuOpen(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        setMenuOpen(false);
        setAdminProfileOpen(false);
    }, [currentPath]);

    useEffect(() => {
        setAdminSession(readAdminSession());
        setRiderSession(readRiderSession());

        function handleStorageChange(event) {
            if (!event.key || event.key === 'inalog-silog-admin-session' || event.key === 'inalog-silog-admin-auto-login') {
                setAdminSession(readAdminSession());
            }

            if (!event.key || event.key === 'inalog-silog-rider-session') {
                setRiderSession(readRiderSession());
            }
        }

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [currentPath]);

    const layoutMode = getLayoutMode(currentPath);
    const hasSession = Boolean(member);
    const firstName = getFirstName(member?.user_metadata?.full_name || member?.email);
    const shellClassName = `site-shell site-shell--${layoutMode}`;
    const headerClassName = `site-header site-header--${layoutMode}`;
    const showInstallBanner = layoutMode === 'public';
    const showFooter = layoutMode === 'public';

    return (
        <div className={shellClassName}>
            <header className={headerClassName}>
                {renderHeaderByMode({
                    currentPath,
                    layoutMode,
                    menuOpen,
                    onToggleMenu: () => setMenuOpen((value) => !value),
                    onCloseMenu: () => setMenuOpen(false),
                    hasSession,
                    firstName,
                    itemCount,
                    riderSession,
                    adminSession,
                    adminProfileOpen,
                    onToggleAdminProfile: () => setAdminProfileOpen((value) => !value),
                    onCloseAdminProfile: () => setAdminProfileOpen(false),
                })}
            </header>

            <main className="page-main">
                {showInstallBanner ? <InstallAppBanner /> : null}
                {children}
            </main>

            {showFooter ? (
                <footer className="site-footer">
                    <div className="site-footer__inner">
                        <div className="site-footer__top">
                            <BrandBlock href="/" eyebrow="Kusina sa Butuan City" name="Inalog Silog" />

                            <div className="site-footer__links">
                                {footerLinks.map((link) => (
                                    <a href={link.href} key={link.href}>
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <p className="site-footer__copy">
                            Pagkaing Pinoy, mainit na serbisyo, at masasayang salu-salo sa Butuan City, Agusan del Norte, Mindanao.
                        </p>
                    </div>
                </footer>
            ) : null}
        </div>
    );
}
