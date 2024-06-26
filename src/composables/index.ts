import type { Coordinate } from 'ol/coordinate';
import { containsCoordinate } from 'ol/extent';
import { useStore } from '~/store';
import type { ShallowRef } from 'vue';
import type { Map } from 'ol';
import { copyText, sleep } from '~/utils';
import type { UserLocalSettings } from '~/types/map';
import { useMapStore } from '~/store/map';
import type { ColorsList } from '~/modules/styles';
import { setHeader, getRequestHeader } from 'h3';

export function isPointInExtent(point: Coordinate, extent = useMapStore().extent) {
    return containsCoordinate(extent, point);
}

export function getCurrentThemeHexColor(color: ColorsList) {
    const store = useStore();
    const theme = store.theme ?? 'default';
    if (theme === 'default') return radarColors[`${ color }Hex`];

    //@ts-expect-error
    return radarThemes[theme][`${ color as ColorsList }Hex`] ?? radarColors[`${ color }Hex`];
}
export function getCurrentThemeRgbColor(color: ColorsList) {
    const store = useStore();
    const theme = store.theme ?? 'default';
    if (theme === 'default') return radarColors[`${ color }Rgb`];

    //@ts-expect-error
    return radarThemes[theme][`${ color as ColorsList }Rgb`] ?? radarColors[`${ color }Rgb`];
}

export function attachMoveEnd(callback: (event: any) => unknown) {
    if (!getCurrentInstance()) throw new Error('Only can attach moveEnd on setup');
    let moveStarted = false;
    let registered = false;
    const map = inject<ShallowRef<Map | null>>('map')!;

    const startHandler = () => {
        moveStarted = true;
    };

    const endHandler = async (e: any) => {
        if (!moveStarted) return;
        moveStarted = false;
        await sleep(300);
        if (moveStarted) return;
        callback(e);
    };

    onBeforeUnmount(() => {
        map.value?.un('movestart', startHandler);
        map.value?.un('moveend', endHandler);
    });

    watch(map, (val) => {
        if (!map.value || registered) return;
        registered = true;

        map.value.on('movestart', startHandler);
        map.value.on('moveend', endHandler);
    }, {
        immediate: true,
    });
}

export function setUserLocalSettings(settings?: UserLocalSettings) {
    const store = useStore();

    const settingsText = localStorage.getItem('local-settings') ?? '{}';
    if (!settings && JSON.stringify(store.localSettings) === settingsText) return;

    let localSettings = JSON.parse(settingsText) as UserLocalSettings;
    localSettings = {
        ...localSettings,
        ...(settings || {}),
    };

    store.localSettings = localSettings;
    localStorage.setItem('local-settings', JSON.stringify(localSettings));
}

export function useCopyText() {
    const copied = ref(false);

    const copy = async (text: string) => {
        copied.value = true;
        await copyText(text);
        await sleep(3000);
        copied.value = false;
    };

    return {
        copyState: copied,
        copy,
    };
}

const iframeWhitelist = [
    'localhost',
    'vatsimsa.com',
];

export function useIframeHeader() {
    if(import.meta.client) return;

    const event = useRequestEvent();
    if(!event) return;

    const referer = getRequestHeader(event, 'referer')?.split('/');
    let origin = referer?.[2]?.split(':')[0];

    const domain = origin?.split('.');
    if(domain) {
        origin = domain.slice(domain.length - 2, domain.length).join('.');
    }

    if(referer && origin && iframeWhitelist.includes(origin)) {
        setHeader(event, 'Content-Security-Policy', `frame-ancestors 'self' ${ referer.slice(0, 3).join('/') }`);
    }
    else {
        setHeader(event, 'Content-Security-Policy', `frame-ancestors 'self'`);
    }
}
