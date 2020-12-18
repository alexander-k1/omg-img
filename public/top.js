let logoLetters = Array.from(document.getElementsByClassName('logo-letter'));
let currentLetter = logoLetters[Math.round(Math.random() * (logoLetters.length - 1))];
setInterval(() => {
  let randomLetter = logoLetters[Math.round(Math.random() * (logoLetters.length - 1))];
  while (randomLetter == currentLetter) {
    randomLetter = logoLetters[Math.round(Math.random() * (logoLetters.length - 1))];
  }
  currentLetter.style.color = "black";
  currentLetter.style.textShadow = "none";
  randomLetter.style.color = "white";
  randomLetter.style.textShadow = "2px 2px white";
  currentLetter = randomLetter;
}, 800);