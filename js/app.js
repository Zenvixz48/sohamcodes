console.log("Portfolio Loaded 🚀");
// ==========================
// HERO CARD MOUSE TILT
// ==========================

const card = document.querySelector(".developer-card");

if(card){

    card.addEventListener("mousemove", (e)=>{

        const rect = card.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;


        const centerX = rect.width / 2;
        const centerY = rect.height / 2;


        const rotateX = ((y - centerY) / centerY) * -8;

        const rotateY = ((x - centerX) / centerX) * 8;


        card.style.transform = `
            perspective(800px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
        `;

    });



    card.addEventListener("mouseleave", ()=>{

        card.style.transform = `
            perspective(800px)
            rotateX(0deg)
            rotateY(0deg)
        `;

    });

}
// ==========================
// CURSOR SPOTLIGHT
// ==========================

const cursorLight = document.querySelector(".cursor-light");


document.addEventListener("mousemove",(e)=>{

    cursorLight.style.left = e.clientX + "px";

    cursorLight.style.top = e.clientY + "px";

});
// ==========================
// LOADER
// ==========================

window.addEventListener("load",()=>{

    const loader = document.querySelector(".loader");


    if(loader){

        setTimeout(()=>{

            loader.classList.add("hide");


        },1500);

    }

});