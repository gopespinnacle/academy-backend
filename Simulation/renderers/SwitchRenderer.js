/*=========================================================
 GOPES PINNACLE
 Switch Renderer
=========================================================*/

const SVG_NS = "http://www.w3.org/2000/svg";

export default class SwitchRenderer {

    static draw(entity, layer) {

        if(entity.group){

            entity.group.setAttribute(
                "transform",
                `translate(${entity.x},${entity.y})`
            );

            return;

        }

        const group=document.createElementNS(SVG_NS,"g");

        group.setAttribute(
            "transform",
            `translate(${entity.x},${entity.y})`
        );

        group.style.cursor="grab";

        // Base

        const base=document.createElementNS(SVG_NS,"rect");

        base.setAttribute("width",80);

        base.setAttribute("height",40);

        base.setAttribute("rx",5);

        base.setAttribute("fill","#ECECEC");

        base.setAttribute("stroke","#555");

        // Lever

        const lever=document.createElementNS(SVG_NS,"line");

        lever.setAttribute("x1",20);

        lever.setAttribute("y1",25);

        lever.setAttribute(

            "x2",

            entity.closed ? 60 : 48

        );

        lever.setAttribute(

            "y2",

            entity.closed ? 15 : 8

        );

        lever.setAttribute("stroke","#222");

        lever.setAttribute("stroke-width","4");

        lever.setAttribute("stroke-linecap","round");

        group.appendChild(base);

        group.appendChild(lever);

        layer.appendChild(group);

        entity.group=group;

    }

}