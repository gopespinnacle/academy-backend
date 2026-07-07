/*=========================================================
 GOPES PINNACLE
 Virtual Science Lab
 Base Entity
=========================================================*/

export default class Entity {

    constructor(options = {}) {

        this.id = options.id || crypto.randomUUID();

        this.type = options.type || "entity";

        this.name = options.name || "Entity";

        // Position
        this.x = options.x ?? 0;
        this.y = options.y ?? 0;

        // Size
        this.width = options.width ?? 80;
        this.height = options.height ?? 80;

        // Transform
        this.rotation = options.rotation ?? 0;
        this.scale = options.scale ?? 1;

        // State
        this.visible = true;
        this.selected = false;
        this.draggable = true;
        this.locked = false;

        // Rendering
        this.rendered = false;
        this.group = null;

        // Metadata
        this.properties = {};

    }

    /*==========================================
        Create SVG Group
    ==========================================*/

    createSVG(parentLayer){

        if(this.group) return;

        const SVG_NS = "http://www.w3.org/2000/svg";

        this.group = document.createElementNS(SVG_NS,"g");

        this.group.classList.add("entity");

        this.group.dataset.id = this.id;

        this.group.style.cursor = "grab";

        parentLayer.appendChild(this.group);

    }

    /*==========================================
        Render
    ==========================================*/

    render(){

        if(!this.group) return;

        this.group.setAttribute(

            "transform",

            `translate(${this.x},${this.y})
             rotate(${this.rotation})
             scale(${this.scale})`

        );

        this.group.style.display =

            this.visible ? "block" : "none";

    }

    /*==========================================
        Move
    ==========================================*/

    move(x,y){

        if(this.locked) return;

        this.x=x;

        this.y=y;

    }

    /*==========================================
        Translate
    ==========================================*/

    translate(dx,dy){

        if(this.locked) return;

        this.x+=dx;

        this.y+=dy;

    }

    /*==========================================
        Rotate
    ==========================================*/

    rotate(angle){

        this.rotation+=angle;

    }

    /*==========================================
        Scale
    ==========================================*/

    setScale(scale){

        this.scale=scale;

    }

    /*==========================================
        Visibility
    ==========================================*/

    show(){

        this.visible=true;

    }

    hide(){

        this.visible=false;

    }

    /*==========================================
        Selection
    ==========================================*/

    select(){

        this.selected=true;

        if(this.group){

            this.group.classList.add("selected");

        }

    }

    deselect(){

        this.selected=false;

        if(this.group){

            this.group.classList.remove("selected");

        }

    }

    /*==========================================
        Bounding Box
    ==========================================*/

    getBounds(){

        return{

            left:this.x,

            top:this.y,

            right:this.x+this.width,

            bottom:this.y+this.height

        };

    }

    /*==========================================
        Update
    ==========================================*/

    update(deltaTime){

    }

}