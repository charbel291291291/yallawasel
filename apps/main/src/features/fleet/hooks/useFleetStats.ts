import { useState, useEffect, useCallback } from 'react';
import { fleetService } from '../services/fleetService';
import { analyticsService } from '../services/analyticsService';

export const useFleetStats = () => {
    const [stats, setStats] = useState<any>({
        kpis: null,
        drivers: [],
        missions: [],
        loading: true,
        error: null
    });

    const refreshData = useCallback(async () => {
        try {
            const [kpis, drivers, missions] = await Promise.all([
                analyticsService.getFleetKPIs(),
                fleetService.getDrivers(),
                fleetService.getActiveMissions()
            ]);

            setStats({
                kpis,
                drivers,
                missions,
                loading: false,
                error: null
            });
        } catch (err: any) {
            setStats((prev: any) => ({ ...prev, loading: false, error: err.message }));
        }
    }, []);

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 10000); // Polling as fallback
        return () => clearInterval(interval);
    }, [refreshData]);

    return { ...stats, refreshData };
};
