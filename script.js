import {
  renderResultTableTurnaround,
  renderResultTableWaiting,
  renderGanttChart,
  generateTimeline,
  renderCPUUtilization,
  getProcessData,
  selectAlgorithm,
  renderProcessTable,
} from "./algorithms/render.js";

import { calculateFCFS } from "./algorithms/fcfs.js";
import { calculateSJF } from "./algorithms/sjf.js";
import { calculateNPP } from "./algorithms/npp.js";
import { calculateRR } from "./algorithms/rr.js";
import { calculateSRTF } from "./algorithms/srtf.js";
import { calculatePP } from "./algorithms/pp.js";

function scheduleAndRender(algorithm, options = {}, mode) {
  resetUI();
  const { processes, timeQuantum } = getProcessData(mode);
  if (!processes || !processes.length) return;
  console.log("Scheduling with mode:", mode, "algorithm:", options.algorithm);
  try {
    console.log("Processes:", processes);
    console.log("Time Quantum:", timeQuantum);
    const output =
      options.algorithm === "RR"
        ? algorithm(processes, timeQuantum)
        : algorithm(processes);

    const { result, totalTime, totalIdle, ganttChart } = output;

    renderResultTableTurnaround(result);
    renderResultTableWaiting(result);
    renderGanttChart(options, ganttChart);
    generateTimeline(result);
    renderCPUUtilization(totalIdle, totalTime, ganttChart);
    renderProcessTable(processes, timeQuantum, mode);
  } catch (error) {
    console.error("Error during scheduling or rendering:", error);
  }
}

function validateTableInputs(algorithm, options = {}, mode) {
  let invalid = false;
  let firstInvalidInput = null;

  const regex = /^\d+$/;

  // Get input values
  const arrivalInput = document.querySelectorAll(".input-box")[0];
  const burstInput = document.querySelectorAll(".input-box")[1];
  const priorityInput = document.querySelectorAll(".input-box")[2]; // May not exist
  const timeQuantumInput = document.getElementById("timeQuantum");

  const arrivalValues = arrivalInput.value
    .trim()
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v !== "");
  const burstValues = burstInput.value
    .trim()
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v !== "");
  const priorityValues = priorityInput
    ? priorityInput.value
        .trim()
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v !== "")
    : [];

  // Validate individual fields (arrival and burst are always required)
  [arrivalInput, burstInput].forEach((input) => {
    if (!input.value.trim()) {
      input.classList.add("is-invalid");
      if (!firstInvalidInput) firstInvalidInput = input;
      invalid = true;
    } else {
      input.classList.remove("is-invalid");
    }
  });

  // Priority input validation (only if mode === "priority")
  if (mode === "priority" && priorityInput) {
    if (!priorityInput.value.trim()) {
      priorityInput.classList.add("is-invalid");
      if (!firstInvalidInput) firstInvalidInput = priorityInput;
      invalid = true;
    } else {
      priorityInput.classList.remove("is-invalid");
    }
  }

  // Time Quantum input validation (only if mode === "roundrobin")
  if (mode === "roundrobin" && timeQuantumInput) {
    const tq = timeQuantumInput.value.trim();
    if (!regex.test(tq)) {
      timeQuantumInput.classList.add("is-invalid");
      if (!firstInvalidInput) firstInvalidInput = timeQuantumInput;
      invalid = true;
    } else {
      timeQuantumInput.classList.remove("is-invalid");
    }
  }

  // Check matching value counts
  if (!invalid) {
    const arrivalCount = arrivalValues.length;
    const burstCount = burstValues.length;
    const priorityCount = priorityValues.length;

    if (
      arrivalCount !== burstCount ||
      (mode === "priority" && priorityCount !== arrivalCount)
    ) {
      invalid = true;
      const toast = new bootstrap.Toast(document.getElementById("liveToast"));
      document.getElementById("toast-body").textContent =
        "Mismatch in Arrival, Burst, or Priority input count.";
      toast.show();
      return false;
    }
  }

  if (invalid) {
    if (firstInvalidInput) {
      firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalidInput.focus();
    }
    return false;
  }

  // Show result containers
  const rows = document.getElementById("rows");
  const rows1 = document.getElementById("rows1");
  if (rows && rows1) {
    rows.style.display = "flex";
    rows1.style.display = "flex";
  }

  const toast1 = new bootstrap.Toast(document.getElementById("liveToast1"));

  toast1.show();
  document.getElementById("check").classList.remove("hides");

  scheduleAndRender(algorithm, options, mode);
  return true;
}

function resetUI() {
  ["head", "gbody", "tail", "queue", "turnaroundTable", "waitingTable"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    }
  );
}

document.querySelectorAll(".algo").forEach((b) => {
  b.addEventListener("click", () => {
    selectAlgorithm(b); // Pass the element, not the string
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const calculate = document.getElementById("calculate");
  const algorithmSelect = document.getElementById("selectedAlgorithm"); // change to your actual ID

  calculate.addEventListener("click", () => {
    const algorithmValue = algorithmSelect.innerText.trim().toUpperCase(); // Normalize input

    switch (algorithmValue) {
      case "FIRST COME FIRST SERVE":
        validateTableInputs(calculateFCFS, {
          showQueue: true,
          algorithm: "FCFS",
        });
        break;

      case "SHORTEST JOB FIRST":
        validateTableInputs(calculateSJF, {
          showQueue: true,
          algorithm: "SJF",
        });
        break;

      case "NON-PREEMPTIVE PRIORITY":
        validateTableInputs(
          calculateNPP,
          { showQueue: true, algorithm: "NPP" },
          "priority"
        );
        break;

      case "PREEMPTIVE PRIORITY":
        validateTableInputs(
          calculatePP,
          { showQueue: true, algorithm: "PP" },
          "priority"
        );
        break;

      case "SHORTEST REMAINING TIME FIRST":
        validateTableInputs(calculateSRTF, {
          showQueue: true,
          algorithm: "SRTF",
        });
        break;

      case "ROUND ROBIN":
        validateTableInputs(
          calculateRR,
          { showQueue: true, algorithm: "RR" },
          "roundrobin"
        );
        break;

      default:
        const modal = new bootstrap.Toast(document.getElementById("liveToast"));
        document.getElementById("toast-body").textContent =
          "Please Select an Algorithm";
        modal.show();
        return;
    }
    document.getElementById("title").innerText = algorithmValue;
  });
});
