import { startGame } from "./game";
import "./style.css";

const gameCanvas = document.getElementById("game-canvas");
const fullWidth = 960;
const fullHeight = 600;

function handleButtonClick() {
  if (gameCanvas.style.display !== "block") {
    startGame();
    gameCanvas.style.display = "block";
    gameCanvas.focus();
    (
      document.getElementById("play-game-button") as HTMLButtonElement
    ).disabled = true;
    const clientWidth = document.documentElement.clientWidth;
    const scale = clientWidth / fullWidth;

    const newWidth = fullWidth * scale;
    const newHeight = fullHeight * scale;

    // #doc left padding in view widths (vw)
    const docVwPaddingX = 4;
    const docPaddingX = (clientWidth / 100) * docVwPaddingX;

    // Scale the canvas and give it a negative margin
    gameCanvas.style.scale = scale.toString();
    gameCanvas.style.marginLeft = `${-(
      fullWidth / 2 -
      newWidth / 2 +
      docPaddingX
    ).toString()}px`;
    gameCanvas.style.marginRight = `${-(
      fullWidth / 2 -
      newWidth / 2 +
      docPaddingX
    ).toString()}px`;
    gameCanvas.style.marginTop = `${-(
      fullHeight / 2 -
      newHeight / 2
    ).toString()}px`;
    gameCanvas.style.marginBottom = `${-(
      fullHeight / 2 -
      newHeight / 2
    ).toString()}px`;
  }
}

document
  .getElementById("play-game-button")
  .addEventListener("click", handleButtonClick);
