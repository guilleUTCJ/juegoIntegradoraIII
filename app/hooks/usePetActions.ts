// hooks/usePetActions.ts
import { usePet } from './usePet';

export const usePetActions = () => {
    const { updateStat } = usePet();

    const feed = () => updateStat('hunger');
    const sleep = () => updateStat('energy');
    const clean = () => updateStat('cleanliness');


    return {
        feed,
        sleep,
        clean,
     
    };
};