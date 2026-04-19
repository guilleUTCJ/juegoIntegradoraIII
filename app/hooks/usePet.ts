// hooks/usePet.ts
import { useEffect, useState } from 'react';
import { petService, PetStats } from '../services/petService';

type PetStatType = keyof Pick<PetStats, 'hunger' | 'energy' | 'cleanliness'>;

export const usePet = () => {
    const [petData, setPetData] = useState<PetStats | null>(null);
    const [loading, setLoading] = useState(true);

    const loadPet = async () => {
        try {
            const data = await petService.getPetData();
            setPetData(data);
        } catch (error) {
            console.log("Error loading pet:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStat = async (type: PetStatType) => {
        if (!petData) return;

        const newValue = Math.min(100, petData[type] + 10);

        // ⚡ Optimistic update
        setPetData(prev => prev ? { ...prev, [type]: newValue } : prev);

        try {
            await petService.updatePetStats({ [type]: newValue });
        } catch (error) {
            console.log("Error updating stat:", error);
            // opcional: rollback aquí si quieres ser pro pro
        }
    };

    useEffect(() => {
        loadPet();
    }, []);

    return { petData, loading, updateStat };
};