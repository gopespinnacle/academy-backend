/*=========================================================
 GOPES PINNACLE
 Virtual Science Lab
 Renderer v2.0
=========================================================*/

export default class Renderer {

    constructor(scene, camera) {

        this.scene = scene;
        this.camera = camera;

        this.svg = null;

        this.layers = {};

        this.registry = new Map();

        this.initialized = false;

    }

    initialize() {

        this.svg = document.getElementById("simulationSVG");

        if (!this.svg) {

            throw new Error("simulationSVG not found.");

        }

        this.layers = {

            grid: document.getElementById("grid"),

            wires: document.getElementById("wireLayer"),

            components: document.getElementById("componentLayer"),

            simulation: document.getElementById("simulationLayer")

        };

        this.resize();

        window.addEventListener(
            "resize",
            () => this.resize()
        );

        this.initialized = true;

    }

    resize() {

        const width = this.svg.clientWidth;

        const height = this.svg.clientHeight;

        this.svg.setAttribute(
            "viewBox",
            `0 0 ${width} ${height}`
        );

    }

    register(type, renderer) {

        this.registry.set(type, renderer);

    }

    render() {

        if (!this.initialized) return;

        this.updateCamera();

        this.scene.entities.forEach(entity => {

            const renderer = this.registry.get(entity.type);

            if (!renderer) return;

            renderer.draw(

                entity,

                this.layers.components

            );

        });

    }

    updateCamera() {

        const transform =

            `translate(${this.camera.x},${this.camera.y})
             scale(${this.camera.zoom})`;

        this.layers.components.setAttribute(

            "transform",

            transform

        );

        this.layers.wires.setAttribute(

            "transform",

            transform

        );

        this.layers.simulation.setAttribute(

            "transform",

            transform

        );

    }

}