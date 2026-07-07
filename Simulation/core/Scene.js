/*=========================================================
  GOPES PINNACLE
  Virtual Science Lab
  Scene Manager
=========================================================*/

export default class Scene {

    constructor() {

        this.entities = [];

        this.systems = [];

        this.selectedEntity = null;

    }

    add(entity) {

        this.entities.push(entity);

        return entity;

    }

    remove(entity) {

        this.entities = this.entities.filter(e => e !== entity);

    }

    clear() {

        this.entities = [];

        this.selectedEntity = null;

    }

    find(id) {

        return this.entities.find(e => e.id === id);

    }

    update(deltaTime) {

        this.entities.forEach(entity => {

            if (entity.update) {

                entity.update(deltaTime);

            }

        });

        this.systems.forEach(system => {

            if (system.update) {

                system.update(deltaTime);

            }

        });

    }

    addSystem(system){

        this.systems.push(system);

    }

}