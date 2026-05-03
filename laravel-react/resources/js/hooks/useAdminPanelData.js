import { useEffect, useState } from 'react';
import { readAdminSession } from '../lib/adminAuth';
import { saveAppointmentAssignment } from '../lib/adminAppointments';
import { buildAdminActivityFeed, logAdminActivity, readAdminActivityLog } from '../lib/adminActivityLog';
import { fetchAdminPanelData } from '../lib/adminPanelData';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export default function useAdminPanelData() {
    const [adminSession, setAdminSession] = useState(() => readAdminSession());
    const [appointments, setAppointments] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [riders, setRiders] = useState([]);
    const [appointmentWarnings, setAppointmentWarnings] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [activities, setActivities] = useState(() => readAdminActivityLog());

    async function loadAdminPanel() {
        if (!adminSession) {
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            const result = await fetchAdminPanelData();
            setAppointments(result.appointments);
            setDeliveries(result.deliveries);
            setCustomers(result.customers);
            setRiders(result.riders);
            setAppointmentWarnings(result.appointmentWarnings || []);
            setWarnings(result.warnings || []);
            setActivities(
                buildAdminActivityFeed({
                    appointments: result.appointments,
                    deliveries: result.deliveries,
                    riders: result.riders,
                    storedActivities: readAdminActivityLog(),
                }),
            );
        } catch (error) {
            setErrorMessage(error?.message || 'The admin panel data could not be loaded.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        setAdminSession(readAdminSession());
    }, []);

    useEffect(() => {
        loadAdminPanel();
    }, [adminSession]);

    useEffect(() => {
        setActivities(
            buildAdminActivityFeed({
                appointments,
                deliveries,
                riders,
                storedActivities: readAdminActivityLog(),
            }),
        );
    }, [appointments, deliveries, riders]);

    useEffect(() => {
        if (!adminSession) {
            return undefined;
        }

        function handleVisibilityChange() {
            if (document.visibilityState === 'visible') {
                loadAdminPanel();
            }
        }

        const intervalId = window.setInterval(() => {
            loadAdminPanel();
        }, 4000);
        const ordersChannel =
            isSupabaseConfigured && supabase
                ? supabase
                      .channel('admin-customer-orders')
                      .on(
                          'postgres_changes',
                          {
                              event: '*',
                              schema: 'public',
                              table: 'customer_orders',
                          },
                          () => {
                              loadAdminPanel();
                          },
                      )
                      .subscribe()
                : null;

        window.addEventListener('storage', loadAdminPanel);
        window.addEventListener('focus', loadAdminPanel);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('storage', loadAdminPanel);
            window.removeEventListener('focus', loadAdminPanel);
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            if (ordersChannel && supabase) {
                supabase.removeChannel(ordersChannel);
            }
        };
    }, [adminSession]);

    function handleAppointmentAssignmentChange(appointmentKey, nextAssignee) {
        const currentAppointment = appointments.find((appointment) => appointment.key === appointmentKey);
        saveAppointmentAssignment(appointmentKey, nextAssignee);

        if (currentAppointment) {
            logAdminActivity({
                type: 'Admin',
                title: 'Admin changed booking assignee',
                detail: `${currentAppointment.customerName} | ${currentAppointment.type} | ${nextAssignee}`,
                actor: adminSession?.name || 'Admin',
                tone: nextAssignee === 'Unassigned' ? 'gold' : 'green',
            });
        }

        setAppointments((currentAppointments) =>
            currentAppointments.map((appointment) =>
                appointment.key === appointmentKey
                    ? {
                          ...appointment,
                          assignedTo: nextAssignee,
                      }
                    : appointment,
            ),
        );

        loadAdminPanel();
    }

    return {
        adminSession,
        appointments,
        deliveries,
        customers,
        riders,
        appointmentWarnings,
        warnings,
        isLoading,
        errorMessage,
        activities,
        loadAdminPanel,
        handleAppointmentAssignmentChange,
    };
}
