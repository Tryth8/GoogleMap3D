import {
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  Texture,
  TextureLoader
} from 'three';

export interface IconMarkerProps {
  iconSrc?: string;
  iconSize?: number;
  color?: Color | string | number;
  labelHeight?: number;
  heading?: number;
  tilt?: number;
  zoom?: number;
  baseZoom?: number;
}

const textureLoader = new TextureLoader();
const textureCache = new Map<string, Texture>();

export default class IconMarker3d extends Group {
  readonly isIconMarker3d: boolean = true;

  private readonly icon: Mesh;
  private readonly labelGroup: Group;
  private readonly anchorPoint: Mesh;
  private readonly line: Mesh;
  private readonly material: MeshBasicMaterial;
  private lastProps: IconMarkerProps;

  constructor(props: IconMarkerProps) {
    super();
    const {iconSrc = '', iconSize = 10, color = 0x0f9d58, labelHeight = 40} = props;

    this.lastProps = {};
    this.icon = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        color: 0xffffff,
        alphaTest: 0.5,
        side: DoubleSide
      })
    );

    this.labelGroup = new Group();
    this.labelGroup.add(this.icon);

    this.material = new MeshBasicMaterial({color});
    this.line = new Mesh(new CylinderGeometry(iconSize * 0.03, iconSize * 0.03, 1, 16, 3), this.material);
    this.line.geometry.translate(0, 0.5, 0);

    this.anchorPoint = new Mesh(
      new SphereGeometry(iconSize * 0.1, 32, 8, 0, 2 * Math.PI, 0, Math.PI),
      this.material
    );

    this.update({iconSrc, iconSize, color, labelHeight, ...props});

    this.add(this.line, this.anchorPoint, this.labelGroup);
  }

  update(props: Partial<IconMarkerProps>) {
    let {color, iconSrc, iconSize, labelHeight, heading, tilt, zoom, baseZoom} = props;

    if (color !== undefined) {
      this.material.color.set(color);
    }

    if (iconSrc !== undefined && iconSrc !== this.lastProps.iconSrc) {
      if (!textureCache.has(iconSrc)) {
        textureCache.set(iconSrc, textureLoader.load(iconSrc));
      }

      (this.icon.material as MeshBasicMaterial).map = textureCache.get(iconSrc)!;
    }

    if (labelHeight !== undefined) {
      // console.log("yersin", labelHeight);
      this.labelGroup.position.y = labelHeight;
      this.line.scale.y = labelHeight;
    }

    if (heading !== undefined && tilt !== undefined) {
      this.icon.rotation.set(
        (90 / 180) * Math.PI,
        (-heading / 180) * Math.PI,
         0,

        'XYZ'
      );
    }

    baseZoom = baseZoom || this.lastProps.baseZoom;
    if (zoom !== undefined && baseZoom !== undefined) {
      this.scale.setScalar(Math.pow(1.6, baseZoom - zoom));
    }

    if (iconSize !== undefined) {
      this.icon.position.y = 1 + iconSize / 2;
      this.icon.scale.setScalar(iconSize);
    }

    this.lastProps = {...this.lastProps, ...props};
  }

  static prefetchIcons(...urls: string[]) {
    for (const url of urls) {
      if (!textureCache.has(url)) {
        textureCache.set(url, textureLoader.load(url));
      }
    }
  }
}
