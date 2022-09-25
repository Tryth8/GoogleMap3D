import {Loader as MapsApiLoader} from '@googlemaps/js-api-loader';

const LOCAL_STORAGE_API_KEY = 'AIzaSyC4lvyPz1RptiaMuuTBcL7Qi_Fl0hJ0KI4';
const LOCAL_STORAGE_MAP_ID = 'ffbf1ef1dd6eeafa';

export function getMapsApiOptions() {
    const storage = window.localStorage;
    const url = new URL(location.href);

    let apiKey = LOCAL_STORAGE_API_KEY;
    let mapId = LOCAL_STORAGE_MAP_ID;

    if (!apiKey || !mapId) {
        apiKey = url.searchParams.get('apiKey');
        mapId = url.searchParams.get('mapId');

        apiKey
            ? storage.setItem(LOCAL_STORAGE_API_KEY, apiKey)
            : (apiKey = storage.getItem(LOCAL_STORAGE_API_KEY));
        mapId
            ? storage.setItem(LOCAL_STORAGE_MAP_ID, mapId)
            : (mapId = storage.getItem(LOCAL_STORAGE_MAP_ID));
    }
    return apiKey && mapId ? {apiKey, mapId} : {};
}

export async function loadMapsApi(libraries = []) {
    const {apiKey, mapId} = getMapsApiOptions();


    if (!apiKey || !mapId) {
        alert(`
      Could not find apikey or mapId as URL parameters.
    `);
    }

    const loader = new MapsApiLoader({
        version: 'beta',
        apiKey,
        libraries
    });

    await loader.load();
}
