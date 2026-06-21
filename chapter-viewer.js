const params = new URLSearchParams(window.location.search);

const chapterId = params.get("id");

if (!chapterId) {

    alert("Chapter ID Missing");

    throw new Error("No Chapter ID");

}

loadChapter();

async function loadChapter() {

    try {

        const token = localStorage.getItem("token");

        const res = await fetch(

            "https://academy-backend-eatl.onrender.com/api/founder/period/chapter/" + chapterId,

            {

                headers: {

                    Authorization: "Bearer " + token

                }

            }

        );

        const data = await res.json();

        if (!data.success) {

            alert(data.message);

            return;

        }

        const chapter = data.chapter;

        document.getElementById("subjectName").innerText = chapter.subject;

        document.getElementById("teacherName").innerText = chapter.teacherName;

        document.getElementById("className").innerText = chapter.className;

        document.getElementById("chapterName").innerText = chapter.chapterName;

        document.getElementById("topicName").innerText = chapter.topicName;

        document.getElementById("loadingScreen").style.display = "none";

        console.log("Drive Link:", chapter.driveLink);

        // Next step:
        // renderPDF(chapter.driveLink);

    }

    catch (err) {

        console.error(err);

        alert("Unable to load chapter.");

    }

}