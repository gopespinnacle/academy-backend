async function loadCuriosity() {

    const res = await fetch("/api/curiosity/all");
    const items = await res.json();

    const featuredContainer = document.getElementById("featuredContent");
    const listContainer = document.getElementById("allContent");

    featuredContainer.innerHTML = "";
    listContainer.innerHTML = "";

    items.forEach(item => {

        let media = "";

        if (item.mediaType === "image") {

            media = `
                <img src="${item.mediaUrl}" class="curiosity-image">
            `;

        }

        if (item.mediaType === "video") {

            media = `
                <video controls class="curiosity-video">
                    <source src="${item.mediaUrl}">
                </video>
            `;

        }

        if (item.mediaType === "pdf") {

            media = `
                <a href="${item.mediaUrl}" target="_blank">
                    📄 Open PDF
                </a>
            `;

        }

        const card = `

        <div class="curiosity-card">

            <h2>${item.title}</h2>

            <h4>${item.category}</h4>

            <p>${item.description}</p>

            ${media}

        </div>

        `;

        if(item.featured){

            featuredContainer.innerHTML += card;

        }else{

            listContainer.innerHTML += card;

        }

    });

}

loadCuriosity();