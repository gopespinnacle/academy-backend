import Engine from "./core/Engine.js";

import ElectricCircuit from "./simulations/electricCircuit.js";

const engine = new Engine();

engine.initialize(

    new ElectricCircuit()

);

engine.start();

window.engine = engine;