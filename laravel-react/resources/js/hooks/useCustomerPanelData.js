import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { getFeaturedMenuItems } from '../data/menuData';
import { getFirstName } from '../lib/formatting';
import { readOrderHistory } from '../lib/orderHistory';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

function getStatusStep(latestOrder, basketCount) {
    const normalizedStatus = String(latestOrder?.status || '').toLowerCase();

    if (normalizedStatus.includes('deliver')) {
        return 3;
    }

    if (normalizedStatus.includes('route') || normalizedStatus.includes('assigned')) {
        return 2;
    }

    if (normalizedStatus.includes('handa') || normalizedStatus.includes('prepar') || normalizedStatus.includes('wait')) {
        return 1;
    }

    if (basketCount > 0) {
        return 1;
    }

    return latestOrder ? 1 : 0;
}

function toText(value, fallback = '') {
    if (typeof value !== 'string') {
        return fallback;
    }

    const normalizedValue = value.trim();

    return normalizedValue || fallback;
}

function toTimestamp(value) {
    const timestamp = new Date(value || '').getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function mapRemoteCustomerOrder(record) {
    const orderItems = Array.isArray(record?.order_items) ? record.order_items : [];
    const assignedRider = toText(record?.rider_name, '');
    const normalizedStatus = String(record?.status || '').toLowerCase();

    return {
        id: toText(record?.order_code || record?.reference_code || (record?.id ? `IS-${String(record.id).slice(-6)}` : ''), ''),
        createdAt: record?.created_at || '',
        updatedAt: record?.updated_at || '',
        claimedAt: record?.claimed_at || (assignedRider ? record?.updated_at || '' : ''),
        deliveredAt: record?.delivered_at || (normalizedStatus.includes('deliver') ? record?.updated_at || '' : ''),
        mode: toText(record?.order_mode, 'delivery'),
        status: toText(record?.status, 'Waiting rider assignment'),
        itemCount: Number(record?.item_count) || orderItems.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0),
        total: Number(record?.total_amount) || 0,
        eta: `${Number(record?.delivery_estimate_minutes) || 15} min`,
        deliveryEstimateMinutes: Number(record?.delivery_estimate_minutes) || 15,
        customerName: toText(record?.customer_name, 'Customer order'),
        email: toText(record?.email, 'No email saved'),
        phone: toText(record?.phone, 'No phone saved'),
        address: toText(record?.delivery_address || record?.address, 'No delivery address saved'),
        paymentMethod: toText(record?.payment_method, 'Payment not set'),
        notes: toText(record?.notes, ''),
        assignedRider,
        riderName: assignedRider || 'Waiting for rider',
        riderVehicle: toText(record?.rider_vehicle, assignedRider ? 'Vehicle not set' : 'Waiting for vehicle'),
        riderCode: toText(record?.rider_code, ''),
        riderZone: toText(record?.rider_zone, ''),
        storeName: 'Inalog Silog Butuan',
        items: orderItems.map((item) => ({
            name: item?.name || 'Order item',
            price: Number(item?.price) || 0,
            quantity: Number(item?.quantity) || 1,
        })),
    };
}

function mergeRecentOrders(localOrders, remoteOrders) {
    const orderMap = new Map();

    [...remoteOrders, ...localOrders].forEach((order) => {
        if (!order?.id) {
            return;
        }

        orderMap.set(order.id, {
            ...orderMap.get(order.id),
            ...order,
        });
    });

    return Array.from(orderMap.values()).sort((left, right) => toTimestamp(right.deliveredAt || right.updatedAt || right.createdAt) - toTimestamp(left.deliveredAt || left.updatedAt || left.createdAt));
}

function getProfileProgress(member) {
    const metadata = member?.user_metadata ?? {};
    const savedAddress = metadata.address || [metadata.district, metadata.region].filter(Boolean).join(', ');
    const fields = [metadata.full_name, member?.email, metadata.phone || member?.phone, savedAddress, metadata.district, metadata.region];
    const filledCount = fields.filter((value) => `${value ?? ''}`.trim()).length;

    if (!filledCount) {
        return 0;
    }

    return Math.round((filledCount / fields.length) * 100);
}

export default function useCustomerPanelData() {
    const [member, setMember] = useState(null);
    const [recentOrders, setRecentOrders] = useState(() => readOrderHistory());
    const { items, itemCount, subtotal, grandTotal, etaText, addItem } = useCart();

    useEffect(() => {
        function refreshOrders() {
            setRecentOrders(readOrderHistory());
        }

        refreshOrders();

        if (!supabase) {
            const intervalId = window.setInterval(refreshOrders, 2000);

            return () => {
                window.clearInterval(intervalId);
            };
        }

        let isMounted = true;

        supabase.auth.getUser().then(({ data }) => {
            if (isMounted) {
                setMember(data.user ?? null);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setMember(session?.user ?? null);
        });

        const intervalId = window.setInterval(refreshOrders, 2000);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!member?.email || !isSupabaseConfigured || !supabase) {
            return undefined;
        }

        let isMounted = true;

        async function refreshRemoteOrders() {
            const { data, error } = await supabase.from('customer_orders').select('*').eq('email', member.email).order('created_at', { ascending: false }).limit(12);

            if (error || !isMounted) {
                return;
            }

            const remoteOrders = (Array.isArray(data) ? data : []).map((record) => mapRemoteCustomerOrder(record)).filter((order) => order.id);
            setRecentOrders(mergeRecentOrders(readOrderHistory(), remoteOrders));
        }

        const ordersChannel = supabase
            .channel(`customer-orders-${member.email}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'customer_orders',
                },
                (payload) => {
                    const rowEmail = payload?.new?.email || payload?.old?.email || '';

                    if (rowEmail === member.email) {
                        refreshRemoteOrders();
                    }
                },
            )
            .subscribe();
        const intervalId = window.setInterval(refreshRemoteOrders, 4000);

        refreshRemoteOrders();

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
            supabase.removeChannel(ordersChannel);
        };
    }, [member?.email]);

    const metadata = member?.user_metadata ?? {};
    const fullName = metadata.full_name || member?.email || 'Kaibigan';
    const firstName = getFirstName(fullName);
    const savedRegion = metadata.region || 'Caraga';
    const savedDistrict = metadata.district || 'Butuan City';
    const savedPhone = metadata.phone || member?.phone || '';
    const savedAddress = metadata.address || [savedDistrict, savedRegion].filter(Boolean).join(', ');
    const profileProgress = getProfileProgress(member);
    const featuredPicks = getFeaturedMenuItems().slice(0, 4);
    const latestOrder = recentOrders[0] || null;
    const latestOrderItems = latestOrder?.items?.slice(0, 3) || items.slice(0, 3);
    const statusStep = getStatusStep(latestOrder, itemCount);

    return {
        member,
        recentOrders,
        items,
        itemCount,
        subtotal,
        grandTotal,
        etaText,
        addItem,
        fullName,
        firstName,
        savedRegion,
        savedDistrict,
        savedPhone,
        profileProgress,
        featuredPicks,
        latestOrder,
        latestOrderItems,
        statusStep,
        savedAddress,
    };
}
