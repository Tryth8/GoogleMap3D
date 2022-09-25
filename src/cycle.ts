import ThreeJSOverlayView from '@ubilabs/threejs-overlay-view';
import {CatmullRomCurve3, Vector3} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry.js';
import {getMapsApiOptions, loadMapsApi} from '../jsm/load-maps-api';
import IconMarker3d from '~/src/icon-marker-3d.ts';
import { Easing, Tween, update } from "@tweenjs/tween.js";

import CAR_MODEL_URL from 'url:../assets/bike.glb';
import DEPARTURE_ICON_URL from '../assets/icons8-a-52.png';
import ARRIVAL_ICON_URL from '../assets/icons8-b-52.png';

const THEME_COLOR = 0x0f9d58;
const MARKER_SIZE = 50;

const CAR_FRONT = new Vector3(0, 1, 0);

const VIEW_PARAMS = {
    center: {lat: 52.37190746, lng: 4.90526689},
    zoom: 18,
    heading: 50,
    tilt: 65
};

const ANIMATION_DURATION = 20000;
const ANIMATION_POINTS = [
{"lat": 52.37190746,	"lng": 4.90526689,	"altitude": -1.398195427 },
{"lat": 52.37143359,	"lng": 4.904098515,	"altitude": -1.308533509 },
{"lat": 52.37130446,	"lng": 4.903811829,	"altitude": -0.011311007 },
{"lat": 52.37110056,	"lng": 4.904112411,	"altitude": -0.435420848 },
{"lat": 52.37088764,	"lng": 4.904277296,	"altitude": 0.847999422 },
{"lat": 52.37065927,	"lng": 4.904168424,	"altitude": 0.737749414 },
{"lat": 52.37036435,	"lng": 4.904500472,	"altitude": 0.666605799 },
{"lat": 52.37059295,	"lng": 4.905730799,	"altitude": 0.692590481 },
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

        carModel.scale.setScalar(0.2 * Math.pow(1.7, 18 - currentZoom));
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
            const carModel = group.getObjectByName('bike');

            carModel.scale.setScalar(2);
            carModel.translateY(50);
            carModel.rotation.set(Math.PI / 2.4, -Math.PI/2, Math.PI, 'ZXY');

            resolve(group);
        });
    });
}

main().catch(err => console.error(err));
