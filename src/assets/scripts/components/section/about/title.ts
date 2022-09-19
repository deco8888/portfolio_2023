import { lerp } from '../../../utils/math';
import Letter from '~/assets/scripts/modules/letter';

export default class Title extends Letter {
    speed: number;
    elms: {
        study: HTMLElement;
    };
    isStudyArea: boolean;
    constructor() {
        super();
        this.borderColor = 'rgb(81 162 247)';
        this.textImage = {
            canvas: null,
            ctx: null,
            data: null,
        };
        this.layers = 4;
        this.gap = 0;
        this.size = 0.2;
        this.target = {
            rotation: {
                x: 0,
                y: 0.1,
            },
        };
        this.rotation = {
            x: 0,
            y: 0.5,
        };
        this.speed = 50;
        this.animFrame = 0;
        this.vector3 = {
            x: 0,
            y: 0,
            z: 0,
        };
        this.scroll = {
            y: 0,
        };
        this.color = {
            front: '#51a2f7',
            back: '#e96747',
        };
        this.font = {
            wight: 900,
            size: this.getFontSize(),
            family: "'Gill Sans', 'Segoe UI', sans-serif", // "'Gill Sans', sans-serif", "'Red Hat Display', sans-serif", "'Nippo', sans-serif" "Arial", //"'Nippo', sans-serif",
            threshold: this.isMobile ? 0.18 : 0.12,
        };
        this.interval = this.isMobile ? 15.0 : 6.0;
        this.text = 'ABOUT¥nME';
    }
    getFontSize(): number {
        return this.isMobile ? this.viewport.width * 0.15 : this.viewport.width * 0.18;
    }
    init(): void {
        this.canvas = document.querySelector('[data-canvas="title"]');
        // カメラ・シーン・レンダラー等の準備
        this.prepare();
        this.font.size = this.getFontSize();
        this.createTextImage();
        this.setBorderStyle('about');
        // 描写する
        this.render();
    }
    async prepare(): Promise<void> {
        this.setSize();
        this.firstWinSize = {
            width: this.canvas.clientWidth,
            height: this.canvas.clientHeight,
        };
        // カメラを作成
        this.three.camera = this.initCamera({
            width: this.canvas.clientWidth,
            height: this.canvas.clientHeight,
            position: {
                x: 0,
                y: 0,
                z: 1000,
            },
        });
        // カメラをシーンに追加
        this.three.scene.add(this.three.camera);
        // レンダラーを作成
        this.three.renderer = this.initRenderer({
            width: this.canvas.clientWidth,
            height: this.canvas.clientHeight,
        });
        console.log({
            width: this.canvas.clientWidth,
            height: this.canvas.clientHeight,
        });
        // HTMLに追加
        this.canvas.appendChild(this.three.renderer.domElement);
        // ビューポート計算
        this.viewport = this.initViewport();
    }
    render(): void {
        if (this.three.object) this.three.object.rotation.y += 0.01;
        // 画面に描画する
        if (this.three.renderer && this.three.camera) this.three.renderer.render(this.three.scene, this.three.camera);
        if (this.three.points) {
            this.update();
            if (!this.isMobile) this.raycast();
        }
        this.animFrame = requestAnimationFrame(this.render.bind(this));
    }
    update(): void {
        const geometry = <THREE.BufferGeometry>this.three.points.geometry;
        const geometryPosition = geometry.attributes.position;
        const positionList = geometryPosition.array;
        const secondList = this.title.secondList.position;
        for (let i = 0; i < positionList.length / 3; i++) {
            const previousX = geometryPosition.getX(i);
            const previousY = geometryPosition.getY(i);
            const lastX = secondList[i * 2];
            const lastY = secondList[i * 2 + 1];
            const currentX = lerp(previousX, lastX, 0.1);
            const currentY = lerp(previousY, lastY, 0.08);
            geometryPosition.setX(i, currentX);
            geometryPosition.setY(i, currentY);
            geometryPosition.needsUpdate = true;
        }
    }
    handleResize(): void {
        this.setSize();
        if (this.three.renderer) {
            this.three.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.three.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        }
        if (this.three.camera) {
            // カメラのアスペクト比を正す
            this.three.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
            this.three.camera.updateProjectionMatrix();
        }
        if (this.three.object) {
            const scale = this.canvas.clientWidth / this.firstWinSize.width;
            this.three.object.scale.set(scale, scale, scale);
        }
    }
}
