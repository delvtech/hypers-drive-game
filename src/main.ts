import { startGame } from "./game";
import "./style.css";

const gameCanvas = document.getElementById("game-canvas");

function handleGameStart() {
  if (gameCanvas.style.display !== "block") {
    startGame();
    gameCanvas.style.display = "block";
    gameCanvas.focus();
    gameCanvas.style.display = "block";

    gameCanvas.focus();
    (document.getElementById("game-button") as HTMLButtonElement).disabled =
      true;
  }
}

function handleGameDocsOpen() {
  document.getElementById("hihi").style.display = "block";
  document.getElementById("hihi").style.marginTop = "10px";
}

document
  .getElementById("game-button")
  .addEventListener("click", handleGameStart);

document
  .getElementById("game-docs")
  .addEventListener("click", handleGameDocsOpen);
