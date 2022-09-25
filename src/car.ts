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

const THEME_COLOR = 0x0f9d58;
const MARKER_SIZE = 400;

const CAR_FRONT = new Vector3(0, 1, 0);

const VIEW_PARAMS = {
    center: {lat: 37.82216331, lng: -122.3356918},
    zoom: 14,
    heading: 20,
    tilt: 65
};

const ANIMATION_DURATION = 50000;
const ANIMATION_POINTS = [
{"lat": 37.8123988,	"lng": -122.3626517,	"altitude": 58.43987247},
{"lat": 37.81675277,	"lng": -122.3559847,	"altitude": 57.75554377},
{"lat": 37.81955724,	"lng": -122.3465341,	"altitude": 57.75557353},
{"lat": 37.82104953,	"lng": -122.3356918,	"altitude": 58.7539262},
{"lat": 37.82216331,	"lng": -122.323728,	"altitude": 38.91548658},
{"lat": 37.82422369,	"lng": -122.3100224,	"altitude": 30.91058337},
{"lat": 37.82449991,	"lng": -122.3049151,	"altitude": 30.07384081},
{"lat": 37.82253666,	"lng": -122.3000641,	"altitude": 30.2838851},
{"lat": 37.8201992,	"lng": -122.2967459,	"altitude": 25.6659089},
{"lat": 37.81851417,	"lng": -122.2968345,	"altitude": 24.54081546},
{"lat": 37.81582332,	"lng": -122.2995865,	"altitude": 23.66594574},
{"lat": 37.8123083,	"lng": -122.3036165,	"altitude": 18.48335247},
{"lat": 37.80935521,	"lng": -122.3049218,	"altitude": 16.73885192},
{"lat": 37.80528026,	"lng": -122.3038972,	"altitude": 15.56084138},
{"lat": 37.80277979,	"lng": -122.3007905,	"altitude": 13.57106323},
{"lat": 37.80177625,	"lng": -122.2963583,	"altitude": 12.7451394},
{"lat": 37.80216968,	"lng": -122.2923654,	"altitude": 8.665702348},
{"lat": 37.80322802,	"lng": -122.2911094,	"altitude": 6.163646818},
];

const mapContainer = document.querySelector('#map');
const tmpVec3 = new Vector3();

async function main() {
    const map = await initMap();
    const zoom = map.getZoom() || 0;

    let departureMarker = new IconMarker3d({
          iconSrc: DEPARTURE_ICON_URL,
          iconSize: MARKER_SIZE,
          color: THEME_COLOR,
          labelHeight: 0,
          baseZoom: zoom
    });

    let arrivalMarker = new IconMarker3d({
      iconSrc: ARRIVAL_ICON_URL,
      iconSize: MARKER_SIZE,
      color: THEME_COLOR,
      labelHeight: 0,
      baseZoom: zoom
    });

    const overlay = new ThreeJSOverlayView(VIEW_PARAMS.center);
    const scene = overlay.getScene();

    overlay.setMap(map);

    const points = ANIMATION_POINTS.map(p => overlay.latLngAltToVector3(p));
    const curve = new CatmullRomCurve3(points, false, 'catmullrom', 0.2);
    curve.updateArcLengths();

    const trackLine = createTrackLine(curve);

    departureMarker.position.copy(curve.getPointAt(0));
    arrivalMarker.position.copy(curve.getPointAt(1));

    scene.add(departureMarker, arrivalMarker, trackLine);

    let carModel = null;
    loadCarModel().then(obj => {
        carModel = obj;
        scene.add(carModel);

        overlay.requestRedraw();
    });


    overlay.update = () => {
        trackLine.material.resolution.copy(overlay.getViewportSize());

        const currentHeading = map.getHeading() || 0;
        const currentTilt = map.getTilt() || 0;
        const currentZoom = map.getZoom() || 0;

        departureMarker.update({heading: currentHeading, tilt: currentTilt, baseZoom: currentZoom});
        arrivalMarker.update({heading: currentHeading, tilt: currentTilt, baseZoom: currentZoom});

        if (!carModel) return;

        const animationProgress =
            (performance.now() % ANIMATION_DURATION) / ANIMATION_DURATION;

        carModel.scale.setScalar(0.2 * Math.pow(1.7, 20 - currentZoom));
        curve.getPointAt(animationProgress, carModel.position);
        curve.getTangentAt(animationProgress, tmpVec3);
        carModel.quaternion.setFromUnitVectors(CAR_FRONT, tmpVec3);

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

function createTrackLine(curve) {
    const numPoints = 10 * curve.points.length;
    const curvePoints = curve.getSpacedPoints(numPoints);
    const positions = new Float32Array(numPoints * 3);

    for (let i = 0; i < numPoints; i++) {
        curvePoints[i].toArray(positions, 3 * i);
    }

    const trackLine = new Line2(
        new LineGeometry(),
        new LineMaterial({
            color: 0x0f9d58,
            linewidth: 5
        })
    );

    trackLine.geometry.setPositions(positions);
    return trackLine;
}

async function loadCarModel() {
    const loader = new GLTFLoader();

    return new Promise(resolve => {
        loader.load(CAR_MODEL_URL, gltf => {
            const group = gltf.scene;
            const carModel = group.getObjectByName('sedan');

            carModel.scale.setScalar(25);
            carModel.rotation.set(Math.PI / 2, 0, Math.PI, 'ZXY');

            resolve(group);
        });
    });
}

main().catch(err => console.error(err));
