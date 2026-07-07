/*=========================================================
  GOPES PINNACLE
  Virtual Science Lab Engine
  Version : 1.0
=========================================================*/

import Scene from "./Scene.js";
import Camera from "./Camera.js";
import Renderer from "./Renderer.js";
import Input from "./Input.js";
import DragManager from "./DragManager.js";
import SelectionManager from "./SelectionManager.js";

export default class Engine {

    constructor() {

        this.scene = null;

        this.camera = null;

        this.renderer = null;

        this.input = null;

        this.dragManager = null;

        this.selectionManager = null;

        this.currentSimulation = null;

        this.running = false;

        this.lastFrame = 0;

    }

    initialize(simulation) {

        this.currentSimulation = simulation;

        this.scene = new Scene();

        this.camera = new Camera();

        this.renderer = new Renderer(this.scene, this.camera);

        this.input = new Input();

        this.dragManager = new DragManager(this.scene);

        this.selectionManager = new SelectionManager(this.scene);

        this.input.initialize();

        this.renderer.initialize();

        this.dragManager.initialize();

        this.selectionManager.initialize();

        if (this.currentSimulation) {

            this.currentSimulation.initialize(this);

        }

    }

    start() {

        if (this.running) return;

        this.running = true;

        requestAnimationFrame(this.loop.bind(this));

    }

    stop() {

        this.running = false;

    }

    loop(timeStamp) {

        if (!this.running) return;

        const delta = timeStamp - this.lastFrame;

        this.lastFrame = timeStamp;

        this.update(delta);

        this.render();

        requestAnimationFrame(this.loop.bind(this));

    }

    update(deltaTime) {

        if (this.currentSimulation) {

            this.currentSimulation.update(deltaTime);

        }

        this.scene.update(deltaTime);

    }

    render() {

        this.renderer.render();

    }

}