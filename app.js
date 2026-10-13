"use strict";
const sectors = [
    { label: "Prize A", weight: 1, color: "#ff4757" },
    { label: "Prize B", weight: 3, color: "#2ed573" }, // 3x more likely than A
    { label: "Prize C", weight: 0.5, color: "#1e90ff" }, // Very rare
    { label: "Prize D", weight: 2, color: "#ffa502" }
];
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const controlsPanel = document.getElementById("controlsPanel");
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
        ctx.arc(0, 0, radius, sector.startAngle, sector.endAngle);
        ctx.closePath();
        ctx.fillStyle = sector.color;
        ctx.fill();
        ctx.stroke();
        // Draw Text Labels
        ctx.save();
        const midAngle = (sector.startAngle + sector.endAngle) / 2;
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
function pickWeightedWinner() {
    const totalWeight = sectors.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    let winner;
    for (const sector of sectors) {
        random -= sector.weight;
        if (random <= 0) {
            winner = sector;
            break;
        }
    }
    // The pointer is at the TOP (-90 degrees or -Math.PI / 2).
    // We need to calculate what rotation brings the winning slice to the top.
    const sectorMidAngle = (winner.startAngle + winner.endAngle) / 2;
    // Target rotation to align the middle of the slice with the top pointer
    const targetAngle = (1.5 * Math.PI) - sectorMidAngle;
    return { sector: winner, targetAngle };
}
// 4. Smoothly Animate the Spin
function spin() {
    if (isSpinning)
        return;
    isSpinning = true;
    spinBtn.disabled = true;
    const { sector, targetAngle } = pickWeightedWinner();
    // Add 5 full extra rotations (10 * Math.PI) for visual speed effect
    const finalRotation = targetAngle + (10 * Math.PI);
    const startRotation = currentRotation % (2 * Math.PI);
    const duration = 4000; // 4 seconds
    const startTime = performance.now();
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Cubic ease-out formula for realistic deceleration physics
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentRotation = startRotation + (finalRotation - startRotation) * easeOut;
        drawWheel();
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
        else {
            isSpinning = false;
            spinBtn.disabled = false;
            alert(`Landed on: ${sector.label}`);
        }
    }
    requestAnimationFrame(animate);
}
// 5. Generate UI Inputs to change weights dynamically
// Helper to generate a random hex color if the user doesn't pick one
function getRandomHexColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}
// Updated UI Generator: Includes delete buttons now
function setupControls() {
    controlsPanel.innerHTML = "";
    sectors.forEach((sector, index) => {
        const div = document.createElement("div");
        div.className = "control-group";
        div.style.cssText = "display: flex; align-items: center; gap: 8px; margin-bottom: 8px; background: #f8f9fa; padding: 8px; border-radius: 4px;";
        div.innerHTML = `
      <span style="width: 15px; height: 15px; background: ${sector.color}; border-radius: 50%; display: inline-block;"></span>
      <strong style="min-width: 80px;">${sector.label}</strong>
      <label>Weight:</label>
      <input type="number" value="${sector.weight}" min="0" step="0.5" style="width: 50px;" id="input-${index}">
      <button class="delete-btn" style="background: #ff4757; padding: 2px 8px; font-size: 12px;" data-index="${index}">X</button>
    `;
        controlsPanel.appendChild(div);
        // Update weights in real time
        const input = div.querySelector("input");
        input.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            sectors[index].weight = isNaN(val) ? 0 : val;
            calculateSectors();
            drawWheel();
        });
        // Delete slice behavior
        const deleteBtn = div.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", () => {
            if (sectors.length <= 2) {
                alert("You need at least 2 slices to spin the wheel!");
                return;
            }
            sectors.splice(index, 1); // Remove from array
            calculateSectors();
            drawWheel();
            setupControls(); // Refresh the list
        });
    });
}
// Logic to hook up the "Add New Slice" UI Form
const addSliceBtn = document.getElementById("addSliceBtn");
const newLabelInput = document.getElementById("newLabel");
const newWeightInput = document.getElementById("newWeight");
const newColorInput = document.getElementById("newColor");
addSliceBtn.addEventListener("click", () => {
    const label = newLabelInput.value.trim();
    const weight = parseFloat(newWeightInput.value);
    const color = newColorInput.value;
    if (!label) {
        alert("Please enter a name for the slice!");
        return;
    }
    if (isNaN(weight) || weight <= 0) {
        alert("Weight must be a number greater than 0!");
        return;
    }
    // Push new segment setup into our array
    sectors.push({ label, weight, color });
    // Recalculate physical positions and update visual views
    calculateSectors();
    drawWheel();
    setupControls();
    // Clear input fields for next entry
    newLabelInput.value = "";
    newWeightInput.value = "1";
    newColorInput.value = getRandomHexColor(); // Cycles colors automatically
});
// Initialization
spinBtn.addEventListener("click", spin);
calculateSectors();
drawWheel();
setupControls();
