import Battery from "../entities/Battery.js";
import Bulb from "../entities/Bulb.js";
import SwitchEntity from "../entities/Switch.js";

export default class ElectricCircuit {

    constructor(){

        this.engine=null;

    }

    initialize(engine){

        this.engine=engine;

        engine.scene.add(

            new Battery(120,120)

        );

        engine.scene.add(

            new Bulb(500,160)

        );

        engine.scene.add(

            new SwitchEntity(320,320)

        );

    }

    update(){

    }

}