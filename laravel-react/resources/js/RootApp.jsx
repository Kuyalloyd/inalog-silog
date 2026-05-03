import { Suspense, lazy, useEffect } from 'react';
import AppErrorBoundary from './components/AppErrorBoundary';
import SiteLayout from './components/SiteLayout';
import { CartProvider } from './context/CartContext';
import { legacyPhpAliasMap } from './data/legacyPhpMap';

const DashboardPage = lazy(() => import('./pages/account/DashboardPage'));
const CustomerMenuPage = lazy(() => import('./pages/account/CustomerMenuPage'));
const OrdersPage = lazy(() => import('./pages/account/OrdersPage'));
const FavoritesPage = lazy(() => import('./pages/account/FavoritesPage'));
const AccountProfilePage = lazy(() => import('./pages/account/AccountProfilePage'));
const CheckoutPage = lazy(() => import('./pages/account/CheckoutPage'));
const OrderTrackingPage = lazy(() => import('./pages/account/OrderTrackingPage'));
const PaymentPage = lazy(() => import('./pages/account/PaymentPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const LogoutPage = lazy(() => import('./pages/auth/LogoutPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyPage = lazy(() => import('./pages/auth/VerifyPage'));
const EventBookingPage = lazy(() => import('./pages/bookings/EventBookingPage'));
const TableBookingPage = lazy(() => import('./pages/bookings/TableBookingPage'));
const VipBookingPage = lazy(() => import('./pages/bookings/VipBookingPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const HomePage = lazy(() => import('./pages/public/HomePage'));
const MenuPage = lazy(() => import('./pages/public/MenuPage'));
const ServicesPage = lazy(() => import('./pages/public/ServicesPage'));
const AdminAppointmentsPage = lazy(() => import('./pages/admin/AdminAppointmentsPage'));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage'));
const AdminDeliveriesPage = lazy(() => import('./pages/admin/AdminDeliveriesPage'));
const AdminForgotPasswordPage = lazy(() => import('./pages/admin/AdminForgotPasswordPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminLogoutPage = lazy(() => import('./pages/admin/AdminLogoutPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const AdminResetPasswordPage = lazy(() => import('./pages/admin/AdminResetPasswordPage'));
const AdminRidersPage = lazy(() => import('./pages/admin/AdminRidersPage'));
const RiderPage = lazy(() => import('./pages/rider/RiderPage'));
const RiderMapPage = lazy(() => import('./pages/rider/RiderMapPage'));
const RiderQueuePage = lazy(() => import('./pages/rider/RiderQueuePage'));
const RiderShiftPage = lazy(() => import('./pages/rider/RiderShiftPage'));
const LendHandPage = lazy(() => import('./pages/support/LendHandPage'));
const VipActivationPage = lazy(() => import('./pages/support/VipActivationPage'));
const VipPage = lazy(() => import('./pages/support/VipPage'));
const MigrationMapPage = lazy(() => import('./pages/system/MigrationMapPage'));
const NotFoundPage = lazy(() => import('./pages/system/NotFoundPage'));

const routes = {
    '/': { title: 'Home', component: HomePage },
    '/about': { title: 'About', component: AboutPage },
    '/services': { title: 'Services', component: ServicesPage },
    '/menu': { title: 'Menu', component: MenuPage },
    '/contact': { title: 'Contact', component: ContactPage },
    '/admin': { title: 'Admin Dashboard', component: AdminPage },
    '/admin/login': { title: 'Admin Login', component: AdminLoginPage },
    '/admin/logout': { title: 'Admin Logout', component: AdminLogoutPage },
    '/admin/forgot-password': { title: 'Admin Forgot Password', component: AdminForgotPasswordPage },
    '/admin/reset-password': { title: 'Admin Reset Password', component: AdminResetPasswordPage },
    '/admin/appointments': { title: 'Admin Bookings', component: AdminAppointmentsPage },
    '/admin/deliveries': { title: 'Admin Deliveries', component: AdminDeliveriesPage },
    '/admin/customers': { title: 'Admin Customers', component: AdminCustomersPage },
    '/admin/riders': { title: 'Admin Riders', component: AdminRidersPage },
    '/rider': { title: 'Rider Panel', component: RiderPage },
    '/rider/map': { title: 'Rider Route Map', component: RiderMapPage },
    '/rider/queue': { title: 'Rider Orders', component: RiderQueuePage },
    '/rider/shift': { title: 'Rider Shift', component: RiderShiftPage },
    '/login': { title: 'Login', component: LoginPage },
    '/register': { title: 'Register', component: RegisterPage },
    '/forgot-password': { title: 'Forgot Password', component: ForgotPasswordPage },
    '/reset-password': { title: 'Reset Password', component: ResetPasswordPage },
    '/verify': { title: 'Verify Email', component: VerifyPage },
    '/logout': { title: 'Logout', component: LogoutPage },
    '/dashboard': { title: 'Dashboard', component: DashboardPage },
    '/dashboard/menu': { title: 'Customer Menu', component: CustomerMenuPage },
    '/dashboard/orders': { title: 'Customer Orders', component: OrdersPage },
    '/dashboard/favorites': { title: 'Customer Favorites', component: FavoritesPage },
    '/dashboard/account': { title: 'Customer Account', component: AccountProfilePage },
    '/checkout': { title: 'Checkout', component: CheckoutPage },
    '/track-order': { title: 'Track Order', component: OrderTrackingPage },
    '/payment': { title: 'Payment Verification', component: PaymentPage },
    '/payment/vip': { title: 'VIP Payment Verification', component: PaymentPage },
    '/bookings/table': { title: 'Table Booking', component: TableBookingPage },
    '/bookings/vip': { title: 'VIP Booking', component: VipBookingPage },
    '/bookings/event': { title: 'Event Booking', component: EventBookingPage },
    '/vip': { title: 'VIP Membership', component: VipPage },
    '/vip/activate': { title: 'Activate VIP', component: VipActivationPage },
    '/lend-hand': { title: 'Lend a Hand', component: LendHandPage },
    '/migration-map': { title: 'PHP Migration Map', component: MigrationMapPage },
};

function normalizePath(pathname) {
    const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

    if (legacyPhpAliasMap[trimmed]) {
        return legacyPhpAliasMap[trimmed] === '/migration-map' ? '/' : legacyPhpAliasMap[trimmed];
    }

    return trimmed.toLowerCase().endsWith('.php') ? '/' : trimmed;
}

function RouteLoadingState() {
    return (
        <section className="page-section">
            <div className="panel-card route-state">
                <p className="eyebrow">Loading</p>
                <h1 className="panel-card__title">Preparing the page...</h1>
                <p className="form-card__text">Please wait while the page loads.</p>
            </div>
        </section>
    );
}

export default function RootApp() {
    const rawPath = window.location.pathname || '/';
    const currentPath = normalizePath(rawPath || '/');
    const route = routes[currentPath];

    useEffect(() => {
        const title = route ? route.title : 'Not Found';
        document.title = `${title} | Inalog Silog`;
    }, [route]);

    const PageComponent = route?.component || NotFoundPage;

    return (
        <CartProvider>
            <SiteLayout currentPath={currentPath}>
                <AppErrorBoundary key={currentPath} currentPath={currentPath}>
                    <Suspense key={currentPath} fallback={<RouteLoadingState />}>
                        <PageComponent key={currentPath} currentPath={currentPath} rawPath={rawPath} />
                    </Suspense>
                </AppErrorBoundary>
            </SiteLayout>
        </CartProvider>
    );
}
