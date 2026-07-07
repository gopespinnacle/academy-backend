/*=========================================================
 GOPES PINNACLE
 Virtual Science Lab
 Battery Entity
=========================================================*/

import Entity from "./Entity.js";

export default class Battery extends Entity {

    constructor(x = 100, y = 100) {

        super({

            id: "battery-" + Date.now(),

            type: "battery",

            name: "Battery",

            x,

            y,

            width: 90,

            height: 50

        });

        /*==================================
            Electrical Properties
        ==================================*/

        this.voltage = 9;

        this.current = 0;

        this.internalResistance = 0;

        this.power = 0;

        this.charge = 100;

        this.isConnected = false;

        /*==================================
            Connection Terminals
        ==================================*/

        this.terminals = {

            positive: {

                name: "positive",

                connected: false,

                wire: null,

                offsetX: this.width,

                offsetY: this.height / 2

            },

            negative: {

                name: "negative",

                connected: false,

                wire: null,

                offsetX: 0,

                offsetY: this.height / 2

            }

        };

    }

    /*==================================
        Positive Terminal Position
    ==================================*/

    getPositiveTerminal(){

        return {

            x: this.x + this.terminals.positive.offsetX,

            y: this.y + this.terminals.positive.offsetY

        };

    }

    /*==================================
        Negative Terminal Position
    ==================================*/

    getNegativeTerminal(){

        return {

            x: this.x + this.terminals.negative.offsetX,

            y: this.y + this.terminals.negative.offsetY

        };

    }

    /*==================================
        Battery State
    ==================================*/

    connect(){

        this.isConnected = true;

    }

    disconnect(){

        this.isConnected = false;

    }

    /*==================================
        Update
    ==================================*/

    update(deltaTime){

        this.power = this.voltage * this.current;

    }

}