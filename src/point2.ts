import ThreeJSOverlayView from '@ubilabs/threejs-overlay-view';
import {CatmullRomCurve3, Vector3} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry.js';
import {getMapsApiOptions, loadMapsApi} from '../jsm/load-maps-api';
import IconMarker3d from '~/src/icon-marker-3d.ts';
import { Easing, Tween, update } from "@tweenjs/tween.js";

import CAR_MODEL_URL from 'url:../assets/lowpoly-sedan.glb';
import DEPARTURE_ICON_URL from '../assets/icons8-a-52.png';
import ARRIVAL_ICON_URL from '../assets/icons8-b-52.png';

const THEME_COLOR = 0xff0000;
const MARKER_SIZE = 100;

const CAR_FRONT = new Vector3(0, 1, 0);

const ANIMATION_DURATION = 50000;
const ANIMATION_POINTS = [
{"lat": 40.74848925,	"lng": -73.98557857,	"altitude": 89.38082797},
];

const VIEW_PARAMS = {
    center: {lat: ANIMATION_POINTS[0].lat, lng: ANIMATION_POINTS[0].lng},
    zoom: 17,
    heading: -180,
    tilt: 65
};

const mapContainer = document.querySelector('#map');
const tmpVec3 = new Vector3();

async function main() {
    const map = await initMap();
    const zoom = map.getZoom() || 0;

    let sphere = new IconMarker3d({
          iconSize: MARKER_SIZE,
          color: THEME_COLOR,
          labelHeight: 0,
          baseZoom: zoom
    });

    const overlay = new ThreeJSOverlayView(VIEW_PARAMS.center);
    const scene = overlay.getScene();

    overlay.setMap(map);
    sphere.translateZ(ANIMATION_POINTS[0].altitude);
    scene.add(sphere);

    let i = 50;
    overlay.update = () => {
      const currentZoom = map.getZoom() || 0;
      const cameraOptions = {
          center: {lat: ANIMATION_POINTS[0].lat, lng: ANIMATION_POINTS[0].lng},
          zoom: 17,
          heading: i,
          tilt: 65
      };
      map.moveCamera(cameraOptions);
      i += 0.15;
        overlay.requestRedraw();
    };
}

async function initMap() {
    const {mapId} = getMapsApiOptions();
    await loadMapsApi();

    return new google.maps.Map(mapContainer, {
        mapId,
        disableDefaultUI: true,
        backgroundColor: 'transparent',
        gestureHandling: 'greedy',
        ...VIEW_PARAMS
    });
}


main().catch(err => console.error(err));
