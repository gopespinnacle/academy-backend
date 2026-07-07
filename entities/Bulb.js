/*=========================================================
 GOPES PINNACLE
 Virtual Science Lab
 Bulb Entity
=========================================================*/

import Entity from "./Entity.js";

export default class Bulb extends Entity {

    constructor(x = 400, y = 150) {

        super({

            id: "bulb-" + Date.now(),

            type: "bulb",

            name: "Bulb",

            x,

            y,

            width: 70,

            height: 70

        });

        /*==================================
            Electrical Properties
        ==================================*/

        this.resistance = 10;

        this.voltage = 0;

        this.current = 0;

        this.power = 0;

        this.brightness = 0;

        this.isOn = false;

        this.isBroken = false;

        /*==================================
            Connection Terminals
        ==================================*/

        this.terminals = {

            left: {

                name: "left",

                connected: false,

                wire: null,

                offsetX: 0,

                offsetY: this.height / 2

            },

            right: {

                name: "right",

                connected: false,

                wire: null,

                offsetX: this.width,

                offsetY: this.height / 2

            }

        };

    }

    /*==================================
        Left Terminal
    ==================================*/

    getLeftTerminal() {

        return {

            x: this.x + this.terminals.left.offsetX,

            y: this.y + this.terminals.left.offsetY

        };

    }

    /*==================================
        Right Terminal
    ==================================*/

    getRightTerminal() {

        return {

            x: this.x + this.terminals.right.offsetX,

            y: this.y + this.terminals.right.offsetY

        };

    }

    /*==================================
        Turn ON
    ==================================*/

    turnOn() {

        if (this.isBroken) return;

        this.isOn = true;

        this.brightness = 100;

    }

    /*==================================
        Turn OFF
    ==================================*/

    turnOff() {

        this.isOn = false;

        this.brightness = 0;

    }

    /*==================================
        Break Bulb
    ==================================*/

    breakBulb() {

        this.isBroken = true;

        this.turnOff();

    }

    /*==================================
        Update
    ==================================*/

    update(deltaTime) {

        this.power = this.voltage * this.current;

    }

}