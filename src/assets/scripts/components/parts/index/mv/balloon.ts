import { Vector2, PointLight, AmbientLight, SpotLight, SpotLightHelper } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GUI } from 'dat.gui';
import { radians } from '~/assets/scripts/utils/helper';
import { removeClass } from '~/assets/scripts/utils/classList';
import { hasClass } from '~/assets/scripts/utils/hasClass';
import Webgl from '~/assets/scripts/modules/webgl';
import { isMobile } from '~/assets/scripts/modules/isMobile';

interface ThreeNumber {
    [key: string]: number;
}

export default class Balloon extends Webgl {
    time: ThreeNumber;
    flg: {
        isMove: boolean;
    };
    gltfLoader: GLTFLoader;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    animFrame?: number;
    mouse: THREE.Vector2;
    gui: GUI;
    isMobile: boolean;
    constructor() {
        super();
        this.winSize = {
            width: 0,
            height: 0,
        };
        this.time = {
            total: 0,
            delta: 0,
        };
        this.flg = {
            isMove: false,
        };
        this.gltfLoader = null;
        this.animFrame = 0;
        this.mouse = new Vector2();
        this.isMobile = isMobile();
    }
    // eslint-disable-next-line require-await
    async init(canvas: HTMLCanvasElement): Promise<void> {
        this.canvas = canvas;
        // 画面サイズを取得
        this.setSize();
        // カメラを作成
        const el = canvas.closest('div');
        this.three.camera = this.initCamera({
            width: el.clientWidth,
            height: el.clientHeight,
            far: 10,
            position: {
                x: 0,
                y: 0,
                z: 3.5,
            },
        });
        // カメラをシーンに追加
        this.three.scene.add(this.three.camera);
        // レンダラーを作成
        this.three.renderer = this.initRenderer({
            canvas: this.canvas,
            width: el.clientWidth,
            height: el.clientHeight,
        });
        this.three.renderer.shadowMap.enabled = true;
        // HTMLに追加
        // this.canvas.appendChild(this.three.renderer.domElement);
        // ビューポート計算
        this.viewport = this.initViewport();
        const color = canvas.getAttribute('data-balloon');
        this.createModels(color);
        this.initAmbientLight();
        // // ポイントライトを作成
        this.initPointLight();
        this.initSpotLight();

        // this.initGui();
    }
    initAmbientLight(): void {
        // ■AmbientLight(色, 光の強さ)
        // 環境光源を実現する。3D空間全体に均等に光を当てる。一律に明るくしたいときに使う。
        // ※陰影や影(cast shadow)ができないので、この光源だけだと立体感を表現することはできない。
        const ambientLight = new AmbientLight('#ffffff', 1.5);
        this.three.ambientLight = ambientLight;
        this.three.scene.add(this.three.ambientLight);
    }
    initPointLight(): void {
        // decay: 光源からの光の減衰
        const pointLight = new PointLight('#ffffff', 2.6);
        this.three.pointLight = pointLight;
        this.three.pointLight.position.set(0, 0, 3);
        this.three.scene.add(this.three.pointLight);
    }
    initSpotLight(): void {
        // DirectionalLight(色, 光の強さ)
        // 特定の方向に放射される光。光源は無限に離れているものとして、そこから発生する光線はすべて平行になる。
        // ※平行光源
        const spotLight = new SpotLight('#ffffff', 1.0);
        this.three.spotLight = spotLight;
        this.three.spotLight.castShadow = true;
        this.three.spotLight.intensity = 2.0;
        const posX = this.isMobile ? 1.5 : 0;
        this.three.spotLight.position.set(posX, 0, 3);
        // this.three.spotLight.angle = radians(45);
        const scale = this.isMobile ? 1 : 2;
        this.three.spotLight.scale.set(scale, scale, scale);
        this.three.spotLightHelper = new SpotLightHelper(this.three.spotLight);
        this.three.scene.add(this.three.spotLight);
    }
    async createModels(color: string): Promise<void> {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/');
        this.gltfLoader = new GLTFLoader();
        this.gltfLoader.setDRACOLoader(dracoLoader);
        const objSrc = `/draco/objs/balloon_${color}_d.glb`;
        await this.loadModel(objSrc);
        this.render();
    }
    // eslint-disable-next-line require-await
    async loadModel(objSrc: string): Promise<void> {
        return new Promise<void>((resolve) => {
            this.gltfLoader.load(objSrc, (obj) => {
                // obj.scene.traverse((model) => {
                //     model.castShadow = true;
                //     model.receiveShadow = true;
                // });
                const scale = this.isMobile ? 1 : 1;
                this.isMobile ? obj.scene.scale.set(scale, scale, scale) : obj.scene.scale.set(scale, scale, scale);
                this.three.object.add(obj.scene);
                // const posY = this.isMobile ? 0 : 0;
                this.three.object.position.set(0, 0, 0);
                // const angleX = this.isMobile ? radians(8) : radians(20);
                this.three.object.rotation.set(0, radians(90), 0);
                resolve();
            });
        });
    }
    setModels(): void {
        this.three.scene.add(this.three.object);
        this.render();
    }
    removeModels(): void {
        removeClass(this.canvas, hasClass.active);
        this.three.scene.clear();
        this.three.renderer.clear();
        this.three.renderer.dispose();
        this.three.renderer.domElement.remove();
        this.three.renderer = null;
    }
    render(): void {
        // 画面に描画する
        this.three.renderer.render(this.three.scene, this.three.camera);
        // this.animFrame = requestAnimationFrame(() => this.render());
    }
    handleResize(): void {
        this.setSize();
        this.initViewport();
        if (this.three.camera) {
            const posY = this.isMobile ? -3 : -3;
            this.three.object.position.set(0, posY, 985);
            // カメラのアスペクト比を正す
            this.three.camera.aspect = this.winSize.width / this.winSize.height;
            this.three.camera.updateProjectionMatrix();
        }
        if (this.three.renderer) {
            this.three.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.three.renderer.setSize(this.winSize.width, this.winSize.height);
        }
        this.render();
    }
}
