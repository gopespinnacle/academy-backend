const API = "https://academy-backend-eatl.onrender.com/api/curiosity";

const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "Vocabulary";

const title = document.getElementById("categoryTitle");
const desc = document.getElementById("categoryDescription");
const featuredSection = document.getElementById("featuredSection");
const contentList = document.getElementById("contentList");
const search = document.getElementById("search");
const filter = document.getElementById("filter");

const categoryInfo = {

    "Vocabulary":{
        icon:"📖",
        desc:"Master powerful words with videos, PDFs, examples and daily practice."
    },

    "Science":{
        icon:"🔬",
        desc:"Discover amazing science wonders through experiments and fascinating facts."
    },

    "Maths":{
        icon:"➗",
        desc:"Improve mathematical thinking using tricks, concepts and real-life applications."
    },

    "Programming":{
        icon:"💻",
        desc:"Learn coding concepts with beginner-friendly tutorials and projects."
    },

    "GK":{
        icon:"🌍",
        desc:"Explore current affairs, countries, inventions and general knowledge."
    },

    "English":{
        icon:"📚",
        desc:"Develop reading, writing and communication skills."
    },

    "Tamil":{
        icon:"📝",
        desc:"Strengthen Tamil language skills with engaging lessons."
    },

    "Grammar":{
        icon:"✍️",
        desc:"Learn grammar rules using easy explanations and examples."
    },

    "Brain Teasers":{
        icon:"🧩",
        desc:"Challenge your IQ with puzzles, riddles and visual thinking."
    },

    "Aptitude":{
        icon:"🧠",
        desc:"Improve logical reasoning and problem-solving abilities."
    },

    "Life Skills":{
        icon:"⭐",
        desc:"Develop confidence, leadership, discipline and communication."
    },

    "World Knowledge":{
        icon:"🌎",
        desc:"Travel the world through geography, history and culture."
    },

    "Fun Facts":{
        icon:"🎉",
        desc:"Learn something surprising every day."
    },

    "Others":{
        icon:"✨",
        desc:"Explore additional educational resources."
    }

};

title.innerHTML =
`${categoryInfo[category]?.icon || "📚"} ${category}`;

desc.innerHTML =
categoryInfo[category]?.desc || "";

let allPosts = [];

loadPosts();

async function loadPosts(){

    contentList.innerHTML="<h2 style='text-align:center;'>Loading...</h2>";

    try{

        const res = await fetch(
        `${API}/category/${encodeURIComponent(category)}`
        );

        const result = await res.json();

        allPosts = result.data || [];

        renderPosts();

    }catch(err){

        contentList.innerHTML=`
        <h2 style="text-align:center;color:red;">
        Unable to load resources.
        </h2>`;

    }

}

function renderPosts(){

    const keyword = search.value.toLowerCase();
    const media = filter.value;

    featuredSection.innerHTML="";
    contentList.innerHTML="";

    let filtered = allPosts.filter(post=>{

        const text =
        (post.title+" "+post.description)
        .toLowerCase();

        const matchSearch =
        text.includes(keyword);

        const matchMedia =
        media==="all" || post.mediaType===media;

        return matchSearch && matchMedia;

    });

    if(filtered.length===0){

        contentList.innerHTML=`

        <div style="
        grid-column:1/-1;
        text-align:center;
        padding:80px;">

        <h2>No Resources Found</h2>

        <p>Please check back later.</p>

        </div>

        `;

        return;

    }

    filtered.forEach(post=>{

        if(post.featured){

            featuredSection.innerHTML=`

            <div class="featured">

            ⭐ FEATURED TODAY ⭐

            <br><br>

            ${post.title}

            </div>

            `;

        }

        let mediaHTML="";

        if(post.mediaType==="image"){

            mediaHTML=`
            <img src="${post.mediaUrl}">
            `;

        }

        if(post.mediaType==="video"){

            mediaHTML=`

            <video controls>

            <source src="${post.mediaUrl}">

            </video>

            `;

        }

        if(post.mediaType==="pdf"){

            mediaHTML=`

            <iframe
            src="${post.mediaUrl}">
            </iframe>

            `;

        }

        contentList.innerHTML += `

        <div class="card">

            ${mediaHTML}

            <div class="cardBody">

                <h2>${post.title}</h2>

                <p>${post.description}</p>

                <div style="
                margin-top:15px;
                color:#0d6efd;
                font-weight:bold;">

                ${post.category}

                </div>

            </div>

        </div>

        `;

    });

}

search.addEventListener("keyup",renderPosts);
filter.addEventListener("change",renderPosts);