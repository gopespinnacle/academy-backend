/*=========================================================
 GOPES PINNACLE
 Bulb Renderer
=========================================================*/

const SVG_NS = "http://www.w3.org/2000/svg";

export default class BulbRenderer {

    static draw(entity, layer) {

        if (entity.group) {

            entity.group.setAttribute(
                "transform",
                `translate(${entity.x},${entity.y})`
            );

            return;
        }

        const group = document.createElementNS(SVG_NS, "g");

        group.setAttribute(
            "transform",
            `translate(${entity.x},${entity.y})`
        );

        group.style.cursor = "grab";

        // Glass

        const glass = document.createElementNS(SVG_NS, "circle");

        glass.setAttribute("cx", 35);
        glass.setAttribute("cy", 28);
        glass.setAttribute("r", 22);

        glass.setAttribute(
            "fill",
            entity.isOn ? "#FFD54F" : "#F5F5F5"
        );

        glass.setAttribute("stroke", "#555");
        glass.setAttribute("stroke-width", "2");

        // Base

        const base = document.createElementNS(SVG_NS, "rect");

        base.setAttribute("x", 28);
        base.setAttribute("y", 48);

        base.setAttribute("width", 14);
        base.setAttribute("height", 18);

        base.setAttribute("fill", "#666");

        group.appendChild(glass);

        group.appendChild(base);

        layer.appendChild(group);

        entity.group = group;

    }

}