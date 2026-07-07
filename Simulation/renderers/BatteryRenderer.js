const SVG = "http://www.w3.org/2000/svg";

export default {

    draw(entity, layer) {

        if (entity.element) {

            entity.element.setAttribute(

                "transform",

                `translate(${entity.x},${entity.y})`

            );

            return;

        }

        const group = document.createElementNS(

            SVG,

            "g"

        );

        group.setAttribute(

            "transform",

            `translate(${entity.x},${entity.y})`

        );

        const body = document.createElementNS(

            SVG,

            "rect"

        );

        body.setAttribute("width",80);

        body.setAttribute("height",40);

        body.setAttribute("rx",6);

        body.setAttribute("fill","#444");

        group.appendChild(body);

        const plus=document.createElementNS(SVG,"text");

        plus.textContent="+";

        plus.setAttribute("x",68);

        plus.setAttribute("y",24);

        plus.setAttribute("fill","white");

        plus.setAttribute("font-size","18");

        group.appendChild(plus);

        const minus=document.createElementNS(SVG,"text");

        minus.textContent="-";

        minus.setAttribute("x",10);

        minus.setAttribute("y",24);

        minus.setAttribute("fill","white");

        minus.setAttribute("font-size","18");

        group.appendChild(minus);

        layer.appendChild(group);

        entity.element = group;

    }

}