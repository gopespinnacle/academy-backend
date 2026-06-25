async function uploadContent(){

    const form = new FormData();

    form.append("title",
        document.getElementById("title").value);

    form.append("category",
        document.getElementById("category").value);

    form.append("description",
        document.getElementById("description").value);

    form.append("mediaType",
        document.getElementById("mediaType").value);

    form.append("featured",
        document.getElementById("featured").checked);

    form.append(
        "file",
        document.getElementById("file").files[0]
    );

    const res = await fetch(
    "https://academy-backend-eatl.onrender.com/api/curiosity/upload",
    {
        method: "POST",
        body: form
    }
);

    const data = await res.json();

    if(data.success){

        alert("Uploaded Successfully");

        loadContent();

    }

}

async function loadContent(){

    const res = await fetch(
    "https://academy-backend-eatl.onrender.com/api/curiosity/all"
);

    const items = await res.json();

    let html="";

    items.forEach(item=>{

        html+=`

<div class="card">

<h3>${item.title}</h3>

<p>${item.description}</p>

<p><b>${item.category}</b></p>

`;

        if(item.mediaType=="image"){

            html+=`
<img src="${item.mediaUrl}">
`;

        }

        if(item.mediaType=="video"){

            html+=`

<video controls>

<source src="${item.mediaUrl}">

</video>

`;

        }

        if(item.mediaType=="pdf"){

            html+=`

<a target="_blank"
href="${item.mediaUrl}">

Open PDF

</a>

`;

        }

        html+=`

<br><br>

<button onclick="deleteContent('${item._id}')">

Delete

</button>

</div>

`;

    });

    document.getElementById("list").innerHTML=html;

}

async function deleteContent(id){

    if(!confirm("Delete?")) return;

    await fetch(
    "https://academy-backend-eatl.onrender.com/api/curiosity/" + id,
    {
        method: "DELETE"
    }
);

    loadContent();

}

loadContent();