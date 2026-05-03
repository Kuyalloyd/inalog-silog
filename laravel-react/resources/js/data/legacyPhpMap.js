export const legacyPhpPageMap = [
    { php: 'index.php', jsxRoute: '/' },
    { php: 'about.php', jsxRoute: '/about' },
    { php: 'services.php', jsxRoute: '/services' },
    { php: 'menu.php', jsxRoute: '/menu' },
    { php: 'contact.php', jsxRoute: '/contact' },
    { php: 'login.php', jsxRoute: '/register' },
    { php: 'new-login.php', jsxRoute: '/login' },
    { php: 'forgot.php', jsxRoute: '/forgot-password' },
    { php: 'reset_pass.php', jsxRoute: '/reset-password' },
    { php: 'verify.php', jsxRoute: '/verify' },
    { php: 'logout.php', jsxRoute: '/logout' },
    { php: 'dashboard.php', jsxRoute: '/dashboard' },
    { php: 'checkout.php', jsxRoute: '/checkout' },
    { php: 'payment-verification.php', jsxRoute: '/payment' },
    { php: 'vip-payment-verification.php', jsxRoute: '/payment/vip' },
    { php: 'table-booking.php', jsxRoute: '/bookings/table' },
    { php: 'vip-booking.php', jsxRoute: '/bookings/vip' },
    { php: 'event-booking/event-booking.php', jsxRoute: '/bookings/event' },
    { php: 'vip/premium.php', jsxRoute: '/vip' },
    { php: 'vip/vip-activator.php', jsxRoute: '/vip/activate' },
    { php: 'lend-hand/lend-hand.php', jsxRoute: '/lend-hand' },
];

export const legacyPhpActionMap = [
    { php: 'manage_cart.php', laravelTarget: 'CartController or session cart service', note: 'Session cart add, remove, and quantity update logic.' },
    { php: 'table-booking-handler.php', laravelTarget: 'BookingController@storeGround', note: 'Ground-floor booking submission and seat conflict checks.' },
    { php: 'update-payment.php', laravelTarget: 'BookingPaymentController@markGroundPaid', note: 'Marks normal booking payment as complete.' },
    { php: 'update-vip-payment.php', laravelTarget: 'BookingPaymentController@markVipPaid', note: 'Marks VIP booking payment as complete.' },
    { php: 'lend-hand/lend_hand_handler.php', laravelTarget: 'DonationController@store', note: 'Stores donation or support submissions.' },
    { php: 'dashboard/feedback.php', laravelTarget: 'FeedbackController@store', note: 'Persists user feedback.' },
    { php: 'dashboard/profile-update.php', laravelTarget: 'ProfileController@update', note: 'Updates guest profile fields.' },
    { php: 'dashboard/password-update.php', laravelTarget: 'PasswordController@update', note: 'Updates the authenticated user password.' },
    { php: 'dashboard/generate-bill.php', laravelTarget: 'OrderBillController@download', note: 'Builds order PDF receipts.' },
    { php: 'dashboard/table-bill.php', laravelTarget: 'BookingBillController@downloadGround', note: 'Builds ground-booking PDF receipts.' },
    { php: 'dashboard/vip-table-bill.php', laravelTarget: 'BookingBillController@downloadVip', note: 'Builds VIP-booking PDF receipts.' },
    { php: 'admin/functions/add-admin.php', laravelTarget: 'AdminManagementController@store', note: 'Creates secondary admin accounts.' },
    { php: 'admin/functions/update-admin.php', laravelTarget: 'AdminManagementController@update', note: 'Updates admin account details.' },
    { php: 'admin/functions/delete-admin.php', laravelTarget: 'AdminManagementController@destroy', note: 'Removes an admin account.' },
    { php: 'admin/functions/add-menu-item.php', laravelTarget: 'AdminMenuController@store', note: 'Creates a new menu item with pricing and availability.' },
    { php: 'admin/functions/update-menu-item.php', laravelTarget: 'AdminMenuController@update', note: 'Updates menu item content, stock, and visibility.' },
    { php: 'admin/functions/delete-menu-item.php', laravelTarget: 'AdminMenuController@destroy', note: 'Deletes a menu item.' },
    { php: 'admin/functions/delete-feedback.php', laravelTarget: 'AdminFeedbackController@destroy', note: 'Removes guest feedback entries.' },
    { php: 'admin/functions/delete-booking.php', laravelTarget: 'AdminBookingController@destroy', note: 'Deletes a reservation or booking record.' },
    { php: 'admin/functions/delete-order.php', laravelTarget: 'AdminOrderController@destroy', note: 'Deletes an order record and related admin artifacts.' },
    { php: 'admin/functions/delete-user.php', laravelTarget: 'AdminUserController@destroy', note: 'Deletes a registered user record.' },
    { php: 'admin/functions/enable-menu-page.php', laravelTarget: 'AdminFeatureToggleController@enableMenu', note: 'Turns the public menu page back on.' },
    { php: 'admin/functions/disable-menu-page.php', laravelTarget: 'AdminFeatureToggleController@disableMenu', note: 'Temporarily hides the public menu page.' },
    { php: 'admin/functions/enable-tablebooking.php', laravelTarget: 'AdminFeatureToggleController@enableTableBooking', note: 'Turns table booking availability back on.' },
    { php: 'admin/functions/disable-tablebooking.php', laravelTarget: 'AdminFeatureToggleController@disableTableBooking', note: 'Temporarily hides or blocks table booking.' },
    { php: 'admin/functions/enable-admin-message.php', laravelTarget: 'AdminMessageController@showBanner', note: 'Shows the public-facing admin banner or alert.' },
    { php: 'admin/functions/disable-admin-message.php', laravelTarget: 'AdminMessageController@hideBanner', note: 'Hides the public-facing admin banner or alert.' },
    { php: 'admin/functions/insert-admin-message.php', laravelTarget: 'AdminMessageController@store', note: 'Creates or updates the live admin message content.' },
];

export const legacyPhpSharedMap = [
    { php: 'server.php', laravelTarget: 'Laravel front controller or artisan serve', note: 'Legacy bootstrap entry point that should be replaced by Laravel routing.' },
    { php: 'session.php', laravelTarget: 'Laravel session middleware', note: 'Top-level session bootstrap for guest flows.' },
    { php: 'admin/session.php', laravelTarget: 'Laravel auth guard middleware', note: 'Admin-only session checks and redirects.' },
    { php: 'admin/functions/session.php', laravelTarget: 'Laravel auth guard middleware', note: 'Protects admin action endpoints before controller execution.' },
    { php: 'dashboard/session.php', laravelTarget: 'Laravel auth middleware', note: 'Protects account dashboard routes and downstream actions.' },
    { php: 'event-booking/session.php', laravelTarget: 'Laravel auth middleware', note: 'Protects event-booking entry checks.' },
    { php: 'lend-hand/session.php', laravelTarget: 'Laravel auth middleware', note: 'Protects donation or support submission access.' },
    { php: 'vip/session.php', laravelTarget: 'Laravel auth middleware', note: 'Protects VIP membership and activation flows.' },
    { php: 'includes/connection.php', laravelTarget: 'Laravel database config and Eloquent models', note: 'Database connection concerns move into framework configuration.' },
    { php: 'includes/header.php', laravelTarget: 'React layout components', note: 'Shared visual header belongs in JSX components and app layout.' },
    { php: 'includes/footer.php', laravelTarget: 'React layout components', note: 'Shared visual footer belongs in JSX components and app layout.' },
    { php: 'includes/menu-data.php', laravelTarget: 'Shared data module or API resource', note: 'Seed menu display data from JS modules or Laravel resources.' },
    { php: 'includes/app_url.php', laravelTarget: 'Laravel URL helpers and environment config', note: 'Base URL logic belongs in framework configuration helpers.' },
];

export const legacyPhpVendorMap = [
    { php: 'PHPMailer/*.php', fileCount: 3, laravelTarget: 'Laravel Mail or a Composer mail package', note: 'Root-level PHPMailer classes are server-side dependencies, not JSX candidates.' },
    { php: 'admin/PHPMailer/*.php', fileCount: 3, laravelTarget: 'Laravel Mail or a Composer mail package', note: 'Admin copies of PHPMailer should become shared mail infrastructure instead of duplicated PHP.' },
    { php: 'fpdf/fpdf.php', fileCount: 1, laravelTarget: 'Composer-managed PDF service', note: 'The core FPDF library stays on the server for bill generation.' },
    { php: 'fpdf/font/*.php', fileCount: 14, laravelTarget: 'Composer-managed PDF service', note: 'Font metric files support PDF output and should remain server-side.' },
    { php: 'fpdf/makefont/*.php', fileCount: 2, laravelTarget: 'Composer-managed PDF tooling', note: 'Font-generation utilities are backend tooling, not React components.' },
    { php: 'fpdf/tutorial/*.php', fileCount: 9, laravelTarget: 'Remove from production app or keep as backend references', note: 'FPDF tutorial files are examples and not part of the React frontend.' },
];

export const legacyPhpAliasMap = Object.fromEntries([
    ...legacyPhpPageMap.map((item) => [`/${item.php}`, item.jsxRoute]),
    ...legacyPhpActionMap.filter((item) => !item.php.startsWith('admin/')).map((item) => [`/${item.php}`, '/migration-map']),
    ...legacyPhpSharedMap.filter((item) => !item.php.startsWith('admin/')).map((item) => [`/${item.php}`, '/migration-map']),
]);

export const legacyPhpTotals = {
    pages: legacyPhpPageMap.length,
    actions: legacyPhpActionMap.length,
    shared: legacyPhpSharedMap.length,
    vendor: legacyPhpVendorMap.reduce((total, group) => total + group.fileCount, 0),
};

export const legacyPhpTrackedTotal = Object.values(legacyPhpTotals).reduce((total, value) => total + value, 0);
