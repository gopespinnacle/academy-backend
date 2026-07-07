/*=========================================================
 Camera
=========================================================*/

export default class Camera {

    constructor() {

        this.x = 0;

        this.y = 0;

        this.zoom = 1;

    }

    move(dx, dy) {

        this.x += dx;

        this.y += dy;

    }

    setZoom(value) {

        this.zoom = Math.max(0.2, Math.min(4, value));

    }

}