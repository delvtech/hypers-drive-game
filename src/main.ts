import { startGame } from "./game";
import "./style.css";

function handleButtonClick() {
  if (document.getElementById("game-canvas").style.display !== "block") {
    startGame();
    document.getElementById("game-canvas").style.display = "block";
    (
      document.getElementById("play-game-button") as HTMLButtonElement
    ).disabled = true;
  }
}

document
  .getElementById("play-game-button")
  .addEventListener("click", handleButtonClick);
