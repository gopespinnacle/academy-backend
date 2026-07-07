/*=========================================================
 GOPES PINNACLE
 Battery Renderer
=========================================================*/

const SVG_NS = "http://www.w3.org/2000/svg";

export default class BatteryRenderer {

    static draw(entity, layer) {

        // Already drawn?
        if (entity.group) {

            entity.group.setAttribute(
                "transform",
                `translate(${entity.x},${entity.y})`
            );

            return;
        }

        //--------------------------------------------------
        // Root Group
        //--------------------------------------------------

        const group = document.createElementNS(SVG_NS, "g");

        group.setAttribute(
            "transform",
            `translate(${entity.x},${entity.y})`
        );

        group.style.cursor = "grab";

        //--------------------------------------------------
        // Battery Body
        //--------------------------------------------------

        const body = document.createElementNS(SVG_NS, "rect");

        body.setAttribute("width", 80);

        body.setAttribute("height", 40);

        body.setAttribute("rx", 6);

        body.setAttribute("fill", "#3B3B3B");

        body.setAttribute("stroke", "#111");

        body.setAttribute("stroke-width", "2");

        //--------------------------------------------------
        // Positive Terminal
        //--------------------------------------------------

        const positive = document.createElementNS(SVG_NS, "rect");

        positive.setAttribute("x", 80);

        positive.setAttribute("y", 13);

        positive.setAttribute("width", 8);

        positive.setAttribute("height", 14);

        positive.setAttribute("fill", "#777");

        //--------------------------------------------------
        // Plus Symbol
        //--------------------------------------------------

        const plus = document.createElementNS(SVG_NS, "text");

        plus.textContent = "+";

        plus.setAttribute("x", 58);

        plus.setAttribute("y", 25);

        plus.setAttribute("fill", "#FFFFFF");

        plus.setAttribute("font-size", "18");

        plus.setAttribute("font-weight", "bold");

        //--------------------------------------------------
        // Minus Symbol
        //--------------------------------------------------

        const minus = document.createElementNS(SVG_NS, "text");

        minus.textContent = "-";

        minus.setAttribute("x", 12);

        minus.setAttribute("y", 25);

        minus.setAttribute("fill", "#FFFFFF");

        minus.setAttribute("font-size", "18");

        minus.setAttribute("font-weight", "bold");

        //--------------------------------------------------

        group.appendChild(body);

        group.appendChild(positive);

        group.appendChild(plus);

        group.appendChild(minus);

        layer.appendChild(group);

        entity.group = group;

    }

}