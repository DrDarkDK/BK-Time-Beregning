/* Globale Variabler */

var date = new Date();

var settings = { //Indstillinger der bør justeres til hver enkelt restaurant.
    breakHour: 4.5, //Hvor mange timer skal man have før man skal have en  (betalt) pause.
    breakDuration: 0.5, //Hvor lange er pauser, i timer?
    pauseRoller: ["Medarbejder"], //Hvilke roller skal have (ikke betalte) pauser, hvis de arbejder nok timer?
    shiftSwitch: "16:00", //Hvornår på dagen skifter man fra morgen skift til aften skift?
}


function minToHour(val) { //Konverter et antal minutter til timer.
    return (val * 0.016666667);
}

function getDuration(startTime, endTime) { //Parametre skal skrives som følgende: "16:00".
    var startH = parseInt(startTime.split(":")[0]);
    var startM = parseInt(startTime.split(":")[1]);
    var endH = parseInt(endTime.split(":")[0]);
    var endM = parseInt(endTime.split(":")[1]);

    var min = minToHour(60-startM + endM);

    return (endH - startH + min - 1);
}

function getHour(Time) { //Parametre skal skrives som følgende: "16:00".
    return parseInt(Time.split(":")[0]);
}

function getMinute(Time) { //Parametre skal skrives som følgende: "16:00".
    return parseInt(Time.split(":")[1]);
}

function getTimeNow() { //Få klokken lige nu, i det korrekte format.
    return (date.getHours() + ":" + date.getMinutes());
}

function compareArray(text, array) { //Check om tekst indeholder ord fra array.
    var result = false;
    for (j = 0; j < array.length; j++) {
        if (text.includes(array[j])) { result = true; }
    }
    return result;
}

function hasBreak(object, duration) { //Skal medarbejderen have en pause?
    var result = false;
    if (compareArray(object.getElementsByClassName("scheduler-shift__type flex flex-row")[0].innerText, settings.pauseRoller)) {
        if (duration > settings.breakHour) {
            return true;
        }
    }
    return result;
}

function calculateHours() { //Lav de nødvendige beregninger, og send manageren informationer omkring timerne.

    var punches = document.getElementsByClassName("schedulerPunch"); //Indstemplinger.
    var shifts = document.getElementsByClassName("scheduler-shift"); //Planlagte vagter.
    
    var hoursMorning = 0; //Antal timer brugt om morgenen.
    var hoursEvening = 0; //Antal timer brugt om aftenen.
    var hoursSum = 0; //Antal timer brugt hele dagen.
    
    var plannedHoursMorning = 0;
    var plannedHoursEvening = 0;
    var plannedHoursSum = 0;

for (var i = 0; i < punches.length;i++) { //Loopet finder ud af hvor mange timer der er brugt i løbet af dagen.
    if (punches[i].children[0].children[0].children[0].innerText != "Punch missing") {
    var timeFrames = punches[i].children[0].children[0].children[0].children[0].innerText.split(" - ");

    /* Morgen timer */

    if (timeFrames[1] == "Open punch") {
        timeFrames[1] = getTimeNow();
    }

    if (getHour(timeFrames[0]) < getHour(settings.shiftSwitch)) { //Hvis vagten starter før morgen->aften skiftet.
        hoursMorning += getHour(timeFrames[1]) < getHour(settings.shiftSwitch) ? getDuration(timeFrames[0], timeFrames[1]) : getDuration(timeFrames[0], settings.shiftSwitch);
        if (getHour(timeFrames[1]) > getHour(settings.shiftSwitch) || (getHour(timeFrames[1]) >= getHour(settings.shiftSwitch) && getMinute(timeFrames[1]) > 0)) {
            hoursEvening += getDuration(settings.shiftSwitch, timeFrames[1]);
        }
    }

    /* Aften timer */

    if (getHour(timeFrames[0]) >= getHour(settings.shiftSwitch)) { //Hvis vagten starter før morgen->aften skiftet.
        hoursEvening += getDuration(timeFrames[0], timeFrames[1]);
    }
}
}

for (var i = 0; i < shifts.length;i++) {
    if (!shifts[i].getAttribute("class").includes("scheduler-shift--subshift")) {
    var timeFrames = shifts[i].children[1].children[0].children[0].children[0].children[0].innerText.split(" - ");

    plannedHoursSum += getDuration(timeFrames[0],timeFrames[1]);

    /* Morgen timer */

    if (getHour(timeFrames[0]) < getHour(settings.shiftSwitch)) { //Hvis vagten starter før morgen->aften skiftet.
        plannedHoursMorning += getHour(timeFrames[1]) < getHour(settings.shiftSwitch) ? getDuration(timeFrames[0], timeFrames[1]) : getDuration(timeFrames[0], settings.shiftSwitch);
        if (getHour(timeFrames[1]) > getHour(settings.shiftSwitch) || (getHour(timeFrames[1]) >= getHour(settings.shiftSwitch) && getMinute(timeFrames[1]) > 0)) {
            plannedHoursEvening += getDuration(settings.shiftSwitch, timeFrames[1]);
        }
        if (hasBreak(shifts[i], getDuration(timeFrames[0], timeFrames[1]))) {
            plannedHoursMorning -= settings.breakDuration;
            plannedHoursSum -= settings.breakDuration;
        }
    }

    /* Aften timer */

    if (getHour(timeFrames[0]) >= getHour(settings.shiftSwitch)) { //Hvis vagten starter før morgen->aften skiftet.
        plannedHoursEvening += getDuration(timeFrames[0], timeFrames[1]);
        if (hasBreak(shifts[i], getDuration(timeFrames[0], timeFrames[1]))) {
            plannedHoursEvening -= settings.breakDuration;
            plannedHoursSum -= settings.breakDuration;
        }
    }

    }
}

hoursSum = hoursMorning + hoursEvening;

/* Giv feedback til manageren */
console.log("(Morgen Timer) Brugt: " + hoursMorning.toFixed(2) + " | Planlagt: " + plannedHoursMorning.toFixed(2) + " | Procent: " + (hoursMorning / plannedHoursMorning * 100).toFixed(2));
console.log("(Aften Timer) Brugt: " + hoursEvening.toFixed(2) + " | Planlagt: " + plannedHoursEvening.toFixed(2) + " | Procent: " + (hoursEvening / plannedHoursEvening * 100).toFixed(2));
console.log("(Timer hele dag) Brugt: " + hoursSum.toFixed(2) + " | Planlagt: " + plannedHoursSum.toFixed(2) + " | Procent: " + (hoursSum / plannedHoursSum * 100).toFixed(2));

}
console.warn("Velkommen til automatiske time beregniner.\n\nKun indstemplede timer er inkluderet. Vær opmærksom på at de planlagte (skemalagte) timer er EKSKLUSIV pauser. Det vil sige, at hvis der er skemalagte pauser, så er de automatisk blevet fjernet fra time antallet.\n\nDe brugte timer er også EKSKLUSIV pauser, så de er allerede fjernet; derfor behøves du ikke at gøre mere.\n\nGenberegn ved at skrive 'calculateHours()' uden '', her i konsollen.\n\n(Udviklet af André Daugaard Nielsen)");
calculateHours();
