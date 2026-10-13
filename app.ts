interface Sector {
  label: string;
  weight: number;
  color: string;
  startAngle?: number; // Calculated dynamically
  endAngle?: number;   // Calculated dynamically
}

const sectors: Sector[] = [
  { label: "Prize A", weight: 1, color: "#ff4757" },
  { label: "Prize B", weight: 3, color: "#2ed573" }, // 3x more likely than A
  { label: "Prize C", weight: 0.5, color: "#1e90ff" }, // Very rare
  { label: "Prize D", weight: 2, color: "#ffa502" }
];

const canvas = document.getElementById("wheelCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const spinBtn = document.getElementById("spinBtn") as HTMLButtonElement;
const controlsPanel = document.getElementById("controlsPanel")!;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = canvas.width / 2;

let currentRotation = 0; // In radians
let isSpinning = false;

// 1. Calculate the dynamic boundary angles based on weights
function calculateSectors() {
  const totalWeight = sectors.reduce((sum, s) => sum + s.weight, 0);
  let currentAngle = 0;

  sectors.forEach(sector => {
    const sliceAngle = (sector.weight / totalWeight) * (2 * Math.PI);
    sector.startAngle = currentAngle;
    sector.endAngle = currentAngle + sliceAngle;
    currentAngle = sector.endAngle;
  });
}

// 2. Draw the wheel onto the HTML5 Canvas
function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  sectors.forEach(sector => {
    ctx.save();
    ctx.translate(centerX, centerY);
    // Rotate the entire canvas context by the current animation rotation
    ctx.rotate(currentRotation);

    // Draw Slice
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, sector.startAngle!, sector.endAngle!);
    ctx.closePath();
    ctx.fillStyle = sector.color;
    ctx.fill();
    ctx.stroke();

    // Draw Text Labels
    ctx.save();
    const midAngle = (sector.startAngle! + sector.endAngle!) / 2;
    ctx.rotate(midAngle);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(sector.label, radius - 20, 5);
    ctx.restore();

    ctx.restore();
  });
}

// 3. Select a winner ahead of time using weighted random algorithm
function pickWeightedWinner(): { sector: Sector; targetAngle: number } {
  const totalWeight = sectors.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  let winner!: Sector;

  for (const sector of sectors) {
    random -= sector.weight;
    if (random <= 0) {
      winner = sector;
      break;
    }
  }

  // The pointer is at the TOP (-90 degrees or -Math.PI / 2).
  // We need to calculate what rotation brings the winning slice to the top.
  const sectorMidAngle = (winner.startAngle! + winner.endAngle!) / 2;

  // Target rotation to align the middle of the slice with the top pointer
  const targetAngle = (1.5 * Math.PI) - sectorMidAngle;

  return { sector: winner, targetAngle };
}

// 4. Smoothly Animate the Spin
function spin() {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;

  const { sector, targetAngle } = pickWeightedWinner();

  // Add 5 full extra rotations (10 * Math.PI) for visual speed effect
  const finalRotation = targetAngle + (10 * Math.PI);
  const startRotation = currentRotation % (2 * Math.PI);
  const duration = 4000; // 4 seconds
  const startTime = performance.now();

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Cubic ease-out formula for realistic deceleration physics
    const easeOut = 1 - Math.pow(1 - progress, 3);

    currentRotation = startRotation + (finalRotation - startRotation) * easeOut;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      spinBtn.disabled = false;
      alert(`Landed on: ${sector.label}`);
    }
  }

  requestAnimationFrame(animate);
}

// 5. Generate UI Inputs to change weights dynamically
function setupControls() {
  controlsPanel.innerHTML = "";
  sectors.forEach((sector, index) => {
    const div = document.createElement("div");
    div.className = "control-group";
    div.innerHTML = `
      <label style="color: ${sector.color}; font-weight:bold;">${sector.label}</label>
      <input type="number" value="${sector.weight}" min="0" step="0.5" style="width: 50px;" id="input-${index}">
    `;
    controlsPanel.appendChild(div);

    const input = div.querySelector("input")!;
    input.addEventListener("input", (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      sectors[index].weight = isNaN(val) ? 0 : val;
      calculateSectors();
      drawWheel();
    });
  });
}

// Initialization
spinBtn.addEventListener("click", spin);
calculateSectors();
drawWheel();
setupControls();
