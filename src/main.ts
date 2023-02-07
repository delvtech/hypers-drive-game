import { startGame } from "./game";
import "./style.css";

const gameCanvas = document.getElementById("game-canvas");

function handleButtonClick() {
  if (gameCanvas.style.display !== "block") {
    startGame();
    gameCanvas.style.display = "block";
    gameCanvas.focus();
    gameCanvas.style.display = "block";
    document.getElementById("hihi").style.display = "block";
    gameCanvas.focus();
    (
      document.getElementById("play-game-button") as HTMLButtonElement
    ).disabled = true;
  }
}

document
  .getElementById("play-game-button")
  .addEventListener("click", handleButtonClick);
