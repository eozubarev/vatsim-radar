import type { SiteConfig} from '~/store';
import { useStore } from '~/store';

const saPreset: SiteConfig = {
    hideAirports: false,
    hideSectors: false,
    theme: 'sa',
    hideHeader: true,
    hideFooter: true,
    allAircraftGreen: true,
    hideAllExternal: true,
};

export function checkAndSetMapPreset() {
    const query = useRoute().query;
    const store = useStore();

    if(!query.preset) return;

    let preset: SiteConfig = {};

    if(query.preset === 'sa') {
        preset = saPreset;
    }

    if(typeof query.airports === 'string') {
        preset.airports = query.airports.split(',').map(x => x.toUpperCase());
        preset.hideSectors = false;
        preset.hideAirports = false;
    }

    if(typeof query.airport === 'string') {
        preset.airport = query.airport.toUpperCase();
        preset.hideSectors = true;
    }

    store.config = preset;
    if(preset.theme) store.theme = preset.theme;
}
