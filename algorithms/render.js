export function selectAlgorithm(element = null) {
  // Remove 'selected' from all
  document
    .querySelectorAll(".select-algorithm li")
    .forEach((li) => li.classList.remove("selected"));

  // Update label text
  const label = document.getElementById("selectedAlgorithm");
  label.textContent = element?.textContent || element;

  let selected = "";

  if (typeof element === "string") {
    selected = element;
  } else if (element) {
    element.classList.add("selected");
    selected = element.textContent.trim();
  }

  // Collapse the dropdown
  const collapseEl = document.getElementById("collapseOne");
  const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseEl);
  bsCollapse.hide();

  // Show/hide extra input
  const extraInputGroup = document.getElementById("extraInputGroup");
  const extraInputLabel = document.getElementById("extraInputLabel");
  const extraInput = document.querySelector(".extraInput");

  if (extraInput) {
    // Reset all attributes first
    extraInput.type = "text";
    extraInput.placeholder = "";
    extraInput.removeAttribute("id");
  }

  if (
    selected === "NON-PREEMPTIVE PRIORITY" ||
    selected === "PREEMPTIVE PRIORITY"
  ) {
    extraInputGroup.style.display = "flex";
    extraInputLabel.innerHTML = "Input Priority Time";
    extraInput.placeholder = "Ex. 1, 2, 3, 4....";
  } else if (selected === "ROUND ROBIN") {
    extraInputGroup.style.display = "flex";
    extraInputLabel.innerHTML = "Input Time Quantum";
    extraInput.type = "number";
    extraInput.placeholder = "3";
    extraInput.setAttribute("id", "timeQuantum");
  } else {
    extraInputGroup.style.display = "none";
  }
}

let turnaroundResult = [];
export function renderGanttChart(result, options = {}, ganttChart) {
  console.log("Type of ganttChart:", typeof ganttChart);
  console.log("Value of ganttChart:", ganttChart);

  const {
    showQueue = true,
    algorithm = "FCFS",
    containerIds = {
      head: "head",
      body: "gbody",
      tail: "tail",
      queue: "queue",
    },
  } = options;

  console.table("oo nga" + ganttChart);

  const h = document.getElementById(containerIds.head);
  const b = document.getElementById(containerIds.body);
  const t = document.getElementById(containerIds.tail);
  const q = document.getElementById(containerIds.queue);

  h.innerHTML = "";
  b.innerHTML = "";
  t.innerHTML = "";
  if (showQueue && q) q.innerHTML = "";

  const timeline = [];
  const timelineProcess = [];
  const burstDurations = [];
  const timeMarkers = [];

  renderQueueTimeline(ganttChart, q, algorithm);

  ganttChart.forEach((entry) => {
    timeline.push(entry.start);
    timelineProcess.push(entry.label);
    burstDurations.push(entry.end - entry.start);
    timeMarkers.push(entry.start);
  });

  if (ganttChart.length > 0) {
    timeMarkers.push(ganttChart[ganttChart.length - 1].end);
  }

  // Tail (Time scale)
  const allTimePoints = ganttChart.map((e) => e.start);
  allTimePoints.push(ganttChart[ganttChart.length - 1].end);
  allTimePoints.forEach((time, i) => {
    const timeDiv = document.createElement("div");
    timeDiv.classList.add("text-start", "gg");
    timeDiv.style.width = "40px";
    timeDiv.style.minWidth = "40px";
    timeDiv.innerHTML = `${time}`;
    if (i === allTimePoints.length - 1) {
      timeDiv.classList.add("bg-blue", "text-center", "px-2");
      timeDiv.style.height = "fit-content";
      timeDiv.style.width = "fit-content";
    }
    t.appendChild(timeDiv);
  });

  // Body (Gantt process blocks)
  timelineProcess.forEach((label) => {
    const box = document.createElement("div");
    box.classList.add("border", "p-1", "text-center", "oo");
    box.style.width = "40px";
    box.style.minWidth = "40px";
    box.innerHTML = `${label}`;
    b.appendChild(box);
  });

  if (algorithm === "RR" || algorithm === "SRTF" || algorithm === "PP") {
    const headPanel = document.createElement("div");
    headPanel.classList.add("d-flex", "flex-column", "gg");

    // Headers
    const rbtHeader = document.createElement("div");
    rbtHeader.classList.add("d-flex", "flex-row");
    const btHeader = document.createElement("div");
    btHeader.classList.add("d-flex", "flex-row", "gg");

    // Header Labels
    const rbtLbl = document.createElement("div");
    rbtLbl.style.width = "40px";
    rbtLbl.style.minWidth = "40px";
    rbtLbl.innerHTML = "<strong>RBt</strong>";
    rbtHeader.appendChild(rbtLbl);

    const btLbl = document.createElement("div");
    btLbl.style.width = "40px";
    btLbl.style.minWidth = "40px";
    btLbl.innerHTML = "<strong>Bt</strong>";
    btHeader.appendChild(btLbl);

    const originalBurstMap = {};
    result.forEach((proc) => {
      originalBurstMap[proc.process ?? proc.label] = proc.burst;
    });
    const rbtMap = {};
    const appearedProcesses = new Set();

    // Add RBt and Bt per Gantt chart entry

    ganttChart.forEach((entry) => {
      const rbtDiv = document.createElement("div");
      rbtDiv.style.width = "40px";
      rbtDiv.style.minWidth = "40px";

      const btDiv = document.createElement("div");
      btDiv.style.width = "40px";
      btDiv.style.minWidth = "40px";

      if (entry.label === "i") {
        rbtDiv.textContent = "";
        btDiv.textContent = "1"; // Idle time
      } else {
        rbtDiv.textContent = entry.rbt === 0 ? "" : entry.rbt ?? "";

        if (appearedProcesses.has(entry.label)) {
          // Process already appeared before - show remaining burst time from rbtMap
          btDiv.textContent = rbtMap[entry.label];
          // Update rbtMap with latest rbt for next appearance
          rbtMap[entry.label] = entry.rbt;
        } else {
          // First appearance - show original burst time
          btDiv.textContent = originalBurstMap[entry.label] ?? "";
          appearedProcesses.add(entry.label);
          // Initialize rbtMap for the process with its current rbt
          rbtMap[entry.label] = entry.rbt;
        }
      }

      rbtHeader.appendChild(rbtDiv);
      btHeader.appendChild(btDiv);
    });

    headPanel.appendChild(rbtHeader);
    headPanel.appendChild(btHeader);
    h.appendChild(headPanel);
  } else {
    // Head (Burst Times)
    const burstLabel = document.createElement("div");
    burstLabel.style.width = "40px";
    burstLabel.innerHTML = "Bt";
    h.appendChild(burstLabel);

    burstDurations.forEach((dur) => {
      const btDiv = document.createElement("div");
      btDiv.style.width = "40px";
      btDiv.style.minWidth = "40px";

      btDiv.innerHTML = `${dur}`;
      h.appendChild(btDiv);
    });
  }
}

function renderQueueTimeline(ganttChart, q, algorithm) {
  if (!q) return;
  q.innerHTML = ""; // Reset container

  const allLabels = new Set();
  ganttChart.forEach((entry) => {
    entry.queue?.forEach((p) =>
      allLabels.add(typeof p === "object" ? p.process : p)
    );
    entry.arrived?.forEach((p) =>
      allLabels.add(typeof p === "object" ? p.process : p)
    );
  });

  // 🟢 Track processes that are already completed
  const completedSet = new Set();

  ganttChart.forEach((entry) => {
    const queueDiv = document.createElement("div");
    queueDiv.classList.add("text-center", "gg");
    queueDiv.style.width = "40px";
    queueDiv.style.minWidth = "40px";
    queueDiv.style.fontSize = "14px";
    queueDiv.style.display = "flex";
    queueDiv.style.flexDirection = "column";
    queueDiv.style.alignItems = "center";

    const renderProc = (proc) => {
      const span = document.createElement("span");
      const name = typeof proc === "object" ? proc.process : proc;
      const priority = typeof proc === "object" ? proc.priority : null;

      span.textContent = priority ? `${name}(${priority})` : name;
      console.log(
        "Checking slash for",
        name,
        "vs",
        entry.label,
        "RBT:",
        entry.rbt
      );

      // ✅ Slash only once — when it finishes
      if (
        ["RR", "SRTF", "PP"].includes(algorithm) &&
        entry.label === name &&
        (entry.rbt === 0 ||
          algorithm === "SRTF" ||
          algorithm === "RR" ||
          algorithm === "PP") &&
        !completedSet.has(name)
      ) {
        span.classList.add("slashed");
        completedSet.add(name); // Mark as completed
        console.log("Slashing", name, "at time", entry.end);
      } else if (
        ["FCFS", "SJF", "NPP"].includes(algorithm) &&
        entry.label === name
      ) {
        span.classList.add("slashed");
        completedSet.add(name); // Mark as completed
        console.log("Slashing", name, "at time", entry.end);
      }

      queueDiv.appendChild(span);
    };

    entry.queue?.forEach(renderProc);
    entry.arrived?.forEach(renderProc);

    q.appendChild(queueDiv);
  });
}

export function renderResultTableTurnaround(result) {
  const tbody = document.querySelector("#resultTable tbody");
  tbody.innerHTML = "";

  // Sort result by process name (P1, P2...)
  result.sort((a, b) => {
    const aNum = parseInt(a.process.replace(/\D/g, ""));
    const bNum = parseInt(b.process.replace(/\D/g, ""));
    return aNum - bNum;
  });
  let process = 1; // Reset process counter for display
  let ave;
  result.forEach((r) => {
    const row = `
      <tr>
        <td>Tt${process++}</td>
        <td class="d-flex flex-row align-items-center">${r.completion}  -   ${
      r.arrival
    }  =   ${r.turnaround}</td>
      </tr>
    `;
    ave = (ave || 0) + r.turnaround;
    tbody.insertAdjacentHTML("beforeend", row);
    turnaroundResult.push(r.turnaround); // Store for later use
  });
  const ttave = `<tr>
  <td>TTave</td>
  <td class="d-flex flex-row align-items-center">${ave}  /   ${
    process - 1
  }  =   <div class="bg-blue px-2 " style="height: fit-content">${(
    ave /
    (process - 1)
  ).toFixed(2)} ms</div></td>
  </tr>`;
  tbody.insertAdjacentHTML("beforeend", ttave);
}

export function renderResultTableWaiting(result) {
  const tbody = document.querySelector("#resultTableWaitingTime tbody");
  tbody.innerHTML = "";

  // Sort result by process name (P1, P2...)
  result.sort((a, b) => {
    const aNum = parseInt(a.process.replace(/\D/g, ""));
    const bNum = parseInt(b.process.replace(/\D/g, ""));
    return aNum - bNum;
  });
  let process = 1; // Reset process counter for display
  let ave;
  result.forEach((r) => {
    const row = `
      <tr>
        <td>Wt${process}</td>
        <td class="d-flex flex-row">${turnaroundResult[process - 1]}  -   ${
      r.burst
    }  =   ${r.waiting}</td>
      </tr>
    `;
    process++;
    ave = (ave || 0) + r.waiting;
    tbody.insertAdjacentHTML("beforeend", row);
  });
  const ttave = `<tr>
  <td>WTave</td>
  <td class="d-flex flex-row align-items-center">${ave}  /   ${
    process - 1
  }  =   <div class="bg-blue px-2 " style="height: fit-content">${(
    ave /
    (process - 1)
  ).toFixed(2)} ms</div> </td>
  </tr>`;
  tbody.insertAdjacentHTML("beforeend", ttave);
}

export function generateTimeline(result) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  const vrline = document.createElement("div");
  vrline.className = "timeline-vrline";

  // Group processes by arrival time
  const grouped = {};
  result.forEach((p) => {
    if (!grouped[p.arrival]) {
      grouped[p.arrival] = [];
    }
    grouped[p.arrival].push(p.process);
  });

  // Sort by arrival time
  const sortedArrivals = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  // Render grouped blocks
  sortedArrivals.forEach((arrival) => {
    const block = document.createElement("div");
    block.className =
      "timeline-block d-flex flex-column gap-2 px-2 py-1 text-center";
    block.style.maxWidth = "60px";
    block.style.width = "60px";

    block.innerHTML = `
        <div class="">${grouped[arrival].join(", ")}</div>
        <div class="timeline-hrline"><div class="line"></div></div>
        <div class="text">${arrival}</div>
      `;

    timeline.appendChild(block);
  });

  timeline.appendChild(vrline);
}

export function renderCPUUtilization(result, totalIdle, ganttChart) {
  let timeline = [];

  let totalBurst = 0;

  ganttChart.forEach((p) => {
    const burst = p.end - p.start;
    timeline.push(burst);
    totalBurst += burst;
  });

  let totalBt = 0;

  result.forEach((p) => {
    totalBt += p.burst;
  });
  const totalTime =
    ganttChart.length > 0 ? ganttChart[ganttChart.length - 1].end : 0;
  const cpuUtil = ((totalTime - totalIdle) / totalTime) * 100;
  document.getElementById("burstt").textContent = ` ${totalBurst}`;
  document.getElementById("adds").textContent = ` ${totalBt} `;
  document.getElementById("wala").textContent = ` × 100 =`;
  document.getElementById("waladin").textContent = `  =`;
  document.getElementById("cpuTotal").textContent = `${cpuUtil.toFixed(2)}%`;

  // Display all timeline times
  const timelineElement = document.getElementById("completion");
  timelineElement.textContent = `${timeline.join(" + ")}`;

  // Display the number of processes
  const processCountElement = document.getElementById("process");
  processCountElement.textContent = `${totalBt}`;
}

export function getProcessData(mode = "") {
  const arrivalInput = document.querySelectorAll(".input-box")[0];
  const burstInput = document.querySelectorAll(".input-box")[1];
  const extraInput = document.querySelector(".extraInput"); // Used for priority or other modes
  const timeQuantumInput = document.getElementById("timeQuantum");

  const parseInput = (inputStr, label) => {
    const values = inputStr
      .split(/[\s,]+/) // Split by space or comma
      .map((v) => v.trim())
      .filter((v) => v !== "");

    const numbers = values.map((v, i) => {
      const num = parseInt(v);
      if (isNaN(num)) {
        throw new Error(`Invalid ${label} at position ${i + 1}: "${v}"`);
      }
      return num;
    });

    return numbers;
  };

  // Parse input values
  const arrivalValues = parseInput(arrivalInput.value, "Arrival Time");
  const burstValues = parseInput(burstInput.value, "Burst Time");

  const expectedLength = arrivalValues.length;

  if (burstValues.length !== expectedLength) {
    throw new Error(
      "Arrival and Burst Time inputs must have the same number of entries."
    );
  }

  // Extra values like priority
  let extraValues = [];
  if (mode.toLowerCase() === "priority") {
    if (!extraInput) {
      throw new Error("Priority input field is missing.");
    }
    extraValues = parseInput(extraInput.value, "Priority");
    if (extraValues.length !== expectedLength) {
      throw new Error("Priority input must match the number of jobs.");
    }
  }

  // Time quantum for RR
  let timeQuantum = null;
  if (mode.toLowerCase() === "roundrobin") {
    if (!timeQuantumInput || !timeQuantumInput.value.trim()) {
      throw new Error("Time Quantum is required for Round Robin.");
    }

    timeQuantum = parseInt(timeQuantumInput.value.trim(), 10);
    if (isNaN(timeQuantum) || timeQuantum <= 0) {
      throw new Error("Time Quantum must be a positive number.");
    }
  }

  // Build processes array
  const processes = arrivalValues.map((arrival, index) => {
    const process = {
      process: `J${index + 1}`,
      arrival,
      burst: burstValues[index],
    };

    if (mode.toLowerCase() === "priority") {
      process.priority = extraValues[index];
    }

    return process;
  });

  return { processes, timeQuantum };
}

export function renderProcessTable(processes, timeQuantum, mode = "") {
  const hasPriority = mode.toLowerCase() === "priority";

  const showTQ = !!timeQuantum;

  const head = document.getElementById("tableHead");
  const body = document.getElementById("tableBody");

  head.innerHTML = ""; // Clear previous
  body.innerHTML = "";

  // Build header
  const headers = ["Job", "AT", "BT"];
  if (hasPriority) headers.push("P");
  if (showTQ) headers.push("TQ");

  const headRow = document.createElement("tr");
  headers.forEach((title) => {
    const th = document.createElement("th");
    th.textContent = title;
    headRow.appendChild(th);
  });
  head.appendChild(headRow);

  // Build rows
  processes.forEach((p) => {
    const row = document.createElement("tr");
    const cells = [p.process, p.arrival, p.burst];
    if (hasPriority) cells.push(p.priority);
    if (showTQ) cells.push(timeQuantum);

    cells.forEach((cellVal) => {
      const td = document.createElement("td");
      td.textContent = cellVal;
      row.appendChild(td);
    });

    body.appendChild(row);
  });
}
