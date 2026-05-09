let selectedPlan = "";

/* MENU */

function showSection(type){

    document.getElementById(
        "academySection"
    ).style.display = "none";

    document.getElementById(
        "vacationSection"
    ).style.display = "none";

    document.getElementById(
        "ecaSection"
    ).style.display = "none";

    if(type === "academy"){

        document.getElementById(
            "academySection"
        ).style.display = "block";

    }

    if(type === "vacation"){

        document.getElementById(
            "vacationSection"
        ).style.display = "block";

    }

    if(type === "eca"){

        document.getElementById(
            "ecaSection"
        ).style.display = "block";

    }

}

/* NEXT PAGE */

function nextPage(page){

    document
    .querySelectorAll(".form-page")
    .forEach(p=>{
        p.classList.remove("active-page");
    });

    document
    .getElementById("page"+page)
    .classList.add("active-page");

    updateSteps(page);

}

/* PREVIOUS PAGE */

function prevPage(page){

    nextPage(page);

}

/* STEP UI */

function updateSteps(page){

    document
    .querySelectorAll(".step")
    .forEach(step=>{
        step.classList.remove("active");
    });

    for(let i=1;i<=page;i++){

        document
        .getElementById(
            "step"+i+"Indicator"
        )
        .classList.add("active");

    }

}

/* PLAN */

function selectPlan(plan, el){

    selectedPlan = plan;

    document
    .querySelectorAll(".plan-card")
    .forEach(card=>{
        card.classList.remove("active");
    });

    el.classList.add("active");

    document.getElementById(
        "selectedPlanText"
    ).innerText = plan;

}

/* PAYMENT */

function payNow(){

    const upiLink =
    "upi://pay?pa=YOURUPI@oksbi&pn=GopesPinnacle&am=500";

    window.location.href = upiLink;

}

/* FINAL SUBMIT */

async function submitApplication(){

    const subjects = [];

    document
    .querySelectorAll(
        ".subjects input:checked"
    )
    .forEach(cb=>{
        subjects.push(cb.value);
    });

    const data = {

        studentName:
        document.getElementById(
            "studentName"
        ).value,

        studentDOB:
        document.getElementById(
            "studentDOB"
        ).value,

        parentName:
        document.getElementById(
            "parentName"
        ).value,

        parentMobile:
        document.getElementById(
            "parentMobile"
        ).value,

        parentWhatsapp:
        document.getElementById(
            "parentWhatsapp"
        ).value,

        parentEmail:
        document.getElementById(
            "parentEmail"
        ).value,

        address:
        document.getElementById(
            "address"
        ).value,

        grade:
        document.getElementById(
            "grade"
        ).value,

        subjects,

        selectedPlan,

        utr:
        document.getElementById(
            "utr"
        ).value

    };

    console.log(data);

    alert(
        "Application Submitted Successfully"
    );

}