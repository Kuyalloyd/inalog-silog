import { useEffect, useState } from 'react';
import useCustomerPanelData from '../../hooks/useCustomerPanelData';
import { formatCurrency, formatShortDate, getFirstName } from '../../lib/formatting';
import { logAdminActivity } from '../../lib/adminActivityLog';
import { supabase } from '../../lib/supabaseClient';

function buildFormValues(member, fallbackValues) {
    return {
        fullName: member?.user_metadata?.full_name || fallbackValues.fullName,
        phone: member?.user_metadata?.phone || member?.phone || fallbackValues.savedPhone,
        address: member?.user_metadata?.address || fallbackValues.savedAddress,
        district: member?.user_metadata?.district || fallbackValues.savedDistrict,
        region: member?.user_metadata?.region || fallbackValues.savedRegion,
    };
}

export default function AccountProfilePage() {
    const { member, fullName, savedAddress, savedDistrict, savedRegion, savedPhone, subtotal } = useCustomerPanelData();
    const [formValues, setFormValues] = useState({
        fullName: '',
        phone: '',
        address: '',
        district: '',
        region: '',
    });
    const [notice, setNotice] = useState('Keep your delivery details updated so checkout and rider drop-off stay smooth.');
    const [noticeTone, setNoticeTone] = useState('info');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!member) {
            return;
        }

        setFormValues(
            buildFormValues(member, {
                fullName,
                savedPhone,
                savedAddress,
                savedDistrict,
                savedRegion,
            }),
        );
    }, [member, fullName, savedPhone, savedAddress, savedDistrict, savedRegion]);

    if (!member) {
        return (
            <section className="page-section">
                <div className="panel-card dashboard-guest">
                    <p className="eyebrow">Account</p>
                    <h1 className="panel-card__title">Mag-login para makita ang account mo.</h1>
                    <p className="form-card__text">Open your customer panel.</p>
                    <div className="page-hero__actions">
                        <a className="button-link" href="/login">
                            Mag-login
                        </a>
                    </div>
                </div>
            </section>
        );
    }

    const previewName = formValues.fullName || fullName;
    const previewFirstName = getFirstName(previewName);
    const previewPhone = formValues.phone || savedPhone;
    const previewAddress = formValues.address || savedAddress;
    const previewDistrict = formValues.district || savedDistrict;
    const previewRegion = formValues.region || savedRegion;
    const profileReady = Math.round(
        ([previewName, member.email, previewPhone, previewAddress, previewDistrict, previewRegion].filter((value) => `${value ?? ''}`.trim()).length / 6) * 100,
    );
    const deliveryReady = [previewName, previewPhone, previewAddress].every((value) => `${value ?? ''}`.trim());
    const noticeClassName = `form-card__notice${
        noticeTone === 'error' ? ' form-card__notice--error' : noticeTone === 'success' ? ' form-card__notice--success' : ''
    }`;

    function updateField(field, value) {
        setFormValues((currentValues) => ({
            ...currentValues,
            [field]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!supabase) {
            setNoticeTone('error');
            setNotice('Profile saving is not available right now. Connect Supabase auth first.');
            return;
        }

        const trimmedValues = {
            fullName: formValues.fullName.trim(),
            phone: formValues.phone.trim(),
            address: formValues.address.trim(),
            district: formValues.district.trim(),
            region: formValues.region.trim(),
        };

        if (!trimmedValues.fullName || !trimmedValues.phone || !trimmedValues.address || !trimmedValues.district || !trimmedValues.region) {
            setNoticeTone('error');
            setNotice('Complete your name, phone, address, district, and region before saving.');
            return;
        }

        setIsSaving(true);
        setNoticeTone('info');
        setNotice('Saving your customer profile...');

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: trimmedValues.fullName,
                    phone: trimmedValues.phone,
                    address: trimmedValues.address,
                    district: trimmedValues.district,
                    region: trimmedValues.region,
                },
            });

            if (error) {
                throw error;
            }

            setFormValues(trimmedValues);
            logAdminActivity({
                type: 'Customer',
                title: 'Customer updated account profile',
                detail: `${trimmedValues.address}, ${trimmedValues.district}, ${trimmedValues.region}`,
                actor: trimmedValues.fullName,
                tone: 'green',
            });
            setNoticeTone('success');
            setNotice('Account updated. Your saved details are ready for checkout and delivery.');
        } catch (error) {
            setNoticeTone('error');
            setNotice(error?.message || 'We could not save your account right now. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <>
            <section className="page-section">
                <div className="dashboard-showcase customer-workspace-banner">
                    <div>
                        <p className="dashboard-panel__eyebrow">Account settings</p>
                        <h1 className="dashboard-showcase__title">Keep your profile order-ready, {previewFirstName}.</h1>
                        <p className="dashboard-showcase__text">
                            Update your delivery name, contact number, and saved location so ordering stays fast on web and phone.
                        </p>

                        <div className="dashboard-showcase__chips">
                            <span>{previewDistrict}</span>
                            <span>{previewRegion}</span>
                            <span>Member since {formatShortDate(member.created_at)}</span>
                        </div>

                        <div className="customer-workspace-banner__actions">
                            <a className="button-link" href="/dashboard">
                                Dashboard
                            </a>
                            <a className="button-link--ghost" href="/dashboard/menu">
                                Food menu
                            </a>
                            <a className="button-link--ghost" href="/dashboard/orders">
                                Orders
                            </a>
                            <a className="button-link--ghost" href="/checkout">
                                Checkout
                            </a>
                        </div>

                        <div className="customer-workspace-kpis">
                            <div className="customer-workspace-kpi">
                                <strong>{profileReady}%</strong>
                                <span>Profile ready</span>
                            </div>
                            <div className="customer-workspace-kpi">
                                <strong>{previewPhone || 'Add phone'}</strong>
                                <span>Mobile</span>
                            </div>
                            <div className="customer-workspace-kpi">
                                <strong>{previewRegion}</strong>
                                <span>Region</span>
                            </div>
                            <div className="customer-workspace-kpi">
                                <strong>{formatCurrency(subtotal)}</strong>
                                <span>Basket subtotal</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-showcase__panel">
                        <article className="dashboard-status-card">
                            <div className="dashboard-status-card__top">
                                <p>Delivery profile</p>
                                <span>{deliveryReady ? 'Ready' : 'Update needed'}</span>
                            </div>
                            <strong>{previewDistrict}</strong>
                            <p>{previewAddress}</p>
                        </article>

                        <article className="dashboard-status-card dashboard-status-card--soft">
                            <div className="dashboard-status-card__top">
                                <p>Account access</p>
                                <span>Secure</span>
                            </div>
                            <strong>{member.email}</strong>
                            <p>Your login email stays protected here while you manage delivery details below.</p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="page-section">
                <div className="dashboard-columns">
                    <div className="dashboard-primary">
                        <article className="customer-workspace-card customer-workspace-card--form">
                            <div className="dashboard-panel__header">
                                <div className="account-editor__field-copy">
                                    <p className="dashboard-panel__eyebrow">Edit profile</p>
                                    <h2 className="panel-card__title">Delivery account details</h2>
                                    <p>Save the same information your customer checkout and rider delivery flow will use.</p>
                                </div>
                                <span className={`account-editor__status${deliveryReady ? '' : ' account-editor__status--warn'}`}>
                                    {deliveryReady ? 'Order-ready' : 'Needs more details'}
                                </span>
                            </div>

                            <form className="account-editor__form" onSubmit={handleSubmit}>
                                <div className="form-grid">
                                    <div className="form-field">
                                        <label htmlFor="account-full-name">Full name</label>
                                        <input
                                            id="account-full-name"
                                            type="text"
                                            autoComplete="name"
                                            value={formValues.fullName}
                                            onChange={(event) => updateField('fullName', event.target.value)}
                                            disabled={isSaving}
                                            placeholder="Your full delivery name"
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label htmlFor="account-phone">Mobile number</label>
                                        <input
                                            id="account-phone"
                                            type="tel"
                                            autoComplete="tel"
                                            value={formValues.phone}
                                            onChange={(event) => updateField('phone', event.target.value)}
                                            disabled={isSaving}
                                            placeholder="09xx xxx xxxx"
                                        />
                                    </div>

                                    <div className="form-field form-field--full account-editor__readonly">
                                        <label htmlFor="account-email">Login email</label>
                                        <input id="account-email" type="email" autoComplete="email" value={member.email || ''} readOnly />
                                        <p className="account-editor__hint">Your sign-in email is shown here so your customer profile stays connected to the right account.</p>
                                    </div>

                                    <div className="form-field form-field--full">
                                        <label htmlFor="account-address">Street address</label>
                                        <textarea
                                            id="account-address"
                                            autoComplete="street-address"
                                            rows={3}
                                            value={formValues.address}
                                            onChange={(event) => updateField('address', event.target.value)}
                                            disabled={isSaving}
                                            placeholder="House number, street, barangay, and delivery notes"
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label htmlFor="account-district">District or city</label>
                                        <input
                                            id="account-district"
                                            type="text"
                                            autoComplete="address-level2"
                                            value={formValues.district}
                                            onChange={(event) => updateField('district', event.target.value)}
                                            disabled={isSaving}
                                            placeholder="Butuan City"
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label htmlFor="account-region">Region</label>
                                        <input
                                            id="account-region"
                                            type="text"
                                            autoComplete="address-level1"
                                            value={formValues.region}
                                            onChange={(event) => updateField('region', event.target.value)}
                                            disabled={isSaving}
                                            placeholder="Caraga"
                                        />
                                    </div>
                                </div>

                                <div className="account-editor__footer">
                                    <p>These saved details appear in checkout and help the rider reach the correct address faster.</p>
                                    <button
                                        className={`button-link form-submit${isSaving ? ' form-submit--loading' : ''}`}
                                        type="submit"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? 'Saving changes...' : 'Save changes'}
                                    </button>
                                </div>
                            </form>

                            <p className={noticeClassName}>{notice}</p>
                        </article>
                    </div>

                    <aside className="dashboard-secondary">
                        <article className="customer-workspace-card">
                            <div className="dashboard-panel__header">
                                <div>
                                    <p className="dashboard-panel__eyebrow">Profile summary</p>
                                    <h2 className="panel-card__title">Saved customer details</h2>
                                </div>
                            </div>

                            <div className="customer-dashboard__info-list">
                                <div>
                                    <span>Customer name</span>
                                    <strong>{previewName}</strong>
                                </div>
                                <div>
                                    <span>Login email</span>
                                    <strong>{member.email}</strong>
                                </div>
                                <div>
                                    <span>Mobile</span>
                                    <strong>{previewPhone || 'No phone saved yet'}</strong>
                                </div>
                                <div>
                                    <span>Delivery address</span>
                                    <strong>{previewAddress}</strong>
                                </div>
                                <div>
                                    <span>Location</span>
                                    <strong>
                                        {previewDistrict}, {previewRegion}
                                    </strong>
                                </div>
                                <div>
                                    <span>Member since</span>
                                    <strong>{formatShortDate(member.created_at)}</strong>
                                </div>
                            </div>
                        </article>

                        <article className="customer-workspace-card">
                            <div className="dashboard-panel__header">
                                <div>
                                    <p className="dashboard-panel__eyebrow">Next actions</p>
                                    <h2 className="panel-card__title">Customer tools</h2>
                                </div>
                            </div>

                            <div className="dashboard-action-grid">
                                <a className="dashboard-action-card" href="/dashboard/menu">
                                    <strong>Food menu</strong>
                                    <p>Open the customer menu and build your next basket.</p>
                                </a>
                                <a className="dashboard-action-card" href="/dashboard/orders">
                                    <strong>Orders</strong>
                                    <p>Check live delivery progress and your recent order history.</p>
                                </a>
                                <a className="dashboard-action-card" href="/checkout">
                                    <strong>Checkout</strong>
                                    <p>Use your saved profile for faster delivery checkout.</p>
                                </a>
                            </div>
                        </article>
                    </aside>
                </div>
            </section>
        </>
    );
}
