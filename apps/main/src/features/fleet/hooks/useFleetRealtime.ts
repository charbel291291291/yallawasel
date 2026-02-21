import { useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';

export const useFleetRealtime = (onUpdate: () => void) => {
    useEffect(() => {
        const driversSub = supabase
            .channel('fleet-drivers')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, onUpdate)
            .subscribe();

        const ordersSub = supabase
            .channel('fleet-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onUpdate)
            .subscribe();

        const zonesSub = supabase
            .channel('fleet-zones')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'demand_zones' }, onUpdate)
            .subscribe();

        return () => {
            driversSub.unsubscribe();
            ordersSub.unsubscribe();
            zonesSub.unsubscribe();
        };
    }, [onUpdate]);
};
