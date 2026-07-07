/*=========================================================
 GOPES PINNACLE
 Virtual Science Lab
 Switch Entity
=========================================================*/

import Entity from "./Entity.js";

export default class SwitchEntity extends Entity {

    constructor(x = 250, y = 250) {

        super({

            id: "switch-" + Date.now(),

            type: "switch",

            name: "Switch",

            x,

            y,

            width: 80,

            height: 40

        });

        /*==================================
            Switch State
        ==================================*/

        this.closed = false;

        this.enabled = true;

        this.isConnected = false;

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
        Toggle
    ==================================*/

    toggle(){

        if(!this.enabled) return;

        this.closed = !this.closed;

    }

    /*==================================
        Open
    ==================================*/

    open(){

        this.closed = false;

    }

    /*==================================
        Close
    ==================================*/

    close(){

        this.closed = true;

    }

    /*==================================
        Left Terminal
    ==================================*/

    getLeftTerminal(){

        return{

            x:this.x + this.terminals.left.offsetX,

            y:this.y + this.terminals.left.offsetY

        };

    }

    /*==================================
        Right Terminal
    ==================================*/

    getRightTerminal(){

        return{

            x:this.x + this.terminals.right.offsetX,

            y:this.y + this.terminals.right.offsetY

        };

    }

    update(deltaTime){

    }

}
