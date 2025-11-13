document.getElementById("run").addEventListener("click", runSimulation);
document.getElementById("reset").addEventListener("click", resetChart);

function parseInput() {
  const lines = document.getElementById("processInput").value.trim().split("\n");
  return lines.map(line => {
    const parts = line.split(" ");
    const [name, arrival, burst, priority] = parts;
    return {
      name,
      arrival: parseInt(arrival),
      burst: parseInt(burst),
      priority: priority ? parseInt(priority) : 0
    };
  });
}

function runSimulation() {
  const algorithm = document.getElementById("algorithm").value;
  const processes = parseInput();
  const quantum = parseInt(document.getElementById("quantum").value);
  const speed = parseInt(document.getElementById("speed").value);

  resetChart();

  let result;
  if (algorithm === "FCFS") result = fcfs(processes);
  else if (algorithm === "SJF") result = sjf(processes);
  else if (algorithm === "RR") result = roundRobin(processes, quantum);
  else if (algorithm === "SRTF") result = srtf(processes);
  else if (algorithm === "PRIORITY") result = priorityScheduling(processes);

  visualize(result, speed);
}

/* ------------ FCFS ------------ */
function fcfs(processes) {
  processes.sort((a, b) => a.arrival - b.arrival);
  let time = 0;
  const chart = [];

  for (let p of processes) {
    if (time < p.arrival) time = p.arrival;
    chart.push({ name: p.name, start: time, end: time + p.burst });
    time += p.burst;
  }
  return chart;
}

/* ------------ SJF ------------ */
function sjf(processes) {
  const result = [];
  let time = 0;
  const ready = [];
  processes.sort((a, b) => a.arrival - b.arrival);

  while (processes.length > 0 || ready.length > 0) {
    while (processes.length > 0 && processes[0].arrival <= time) {
      ready.push(processes.shift());
    }

    if (ready.length === 0) {
      time++;
      continue;
    }

    ready.sort((a, b) => a.burst - b.burst);
    const p = ready.shift();
    result.push({ name: p.name, start: time, end: time + p.burst });
    time += p.burst;
  }

  return result;
}

/* ------------ Round Robin ------------ */
function roundRobin(processes, quantum) {
  const queue = [...processes].sort((a, b) => a.arrival - b.arrival);
  const result = [];
  const ready = [];
  let time = 0;

  while (queue.length > 0 || ready.length > 0) {
    while (queue.length > 0 && queue[0].arrival <= time) ready.push(queue.shift());

    if (ready.length === 0) {
      time++;
      continue;
    }

    const p = ready.shift();
    const runTime = Math.min(p.burst, quantum);
    result.push({ name: p.name, start: time, end: time + runTime });
    p.burst -= runTime;
    time += runTime;

    while (queue.length > 0 && queue[0].arrival <= time) ready.push(queue.shift());
    if (p.burst > 0) ready.push(p);
  }
  return result;
}

/* ------------ Priority Scheduling ------------ */
function priorityScheduling(processes) {
  const result = [];
  const queue = processes.map(p => ({ ...p }));
  queue.sort((a, b) => a.arrival - b.arrival);

  const ready = [];
  let time = 0;

  while (queue.length > 0 || ready.length > 0) {
    while (queue.length > 0 && queue[0].arrival <= time) ready.push(queue.shift());

    if (ready.length === 0) {
      time++;
      continue;
    }

    ready.sort((a, b) => a.priority - b.priority);
    const p = ready.shift();
    result.push({ name: p.name, start: time, end: time + p.burst });
    time += p.burst;
  }

  return result;
}

/* ------------ Helper: Merge adjacent same-process blocks ------------ */
function mergeContinuous(chart) {
  if (chart.length === 0) return chart;
  const merged = [chart[0]];

  for (let i = 1; i < chart.length; i++) {
    const last = merged[merged.length - 1];
    if (chart[i].name === last.name && chart[i].start === last.end) {
      last.end = chart[i].end;
    } else {
      merged.push(chart[i]);
    }
  }
  return merged;
}

/* ------------ Visualization ------------ */


function visualize(chart, speed) {
  const gantt = document.getElementById("ganttChart");
  const timeScale = document.getElementById("timeScale");
  gantt.innerHTML = "";
  timeScale.innerHTML = "";

  // Insert idle blocks where CPU is waiting
  const fixedChart = [];
  for (let i = 0; i < chart.length; i++) {
    if (i > 0 && chart[i].start > chart[i - 1].end) {
      fixedChart.push({
        name: "Idle",
        start: chart[i - 1].end,
        end: chart[i].start,
        idle: true,
      });
    }
    fixedChart.push(chart[i]);
  }

  const totalTime = fixedChart[fixedChart.length - 1].end;
  const unitWidth = 50; // width of one time unit

  // ✅ Assign a stable color per process name
  const colorMap = {};
  let colorIndex = 0;

  // Pre-assign colors to processes
  fixedChart.forEach(p => {
    if (!p.idle && !colorMap[p.name]) {
      colorMap[p.name] = `hsl(${(colorIndex * 80) % 360}, 70%, 60%)`;
      colorIndex++;
    }
  });

  // Animate each block
  fixedChart.forEach((p, index) => {
    setTimeout(() => {
      const block = document.createElement("div");
      block.classList.add("gantt-block");
      block.style.width = (p.end - p.start) * unitWidth + "px";
      block.style.transition = "transform 0.5s ease";
      block.style.transform = "scale(0)";
      block.style.backgroundColor = p.idle
        ? "#374151" // dark gray for idle
        : colorMap[p.name]; // stable color

      // Add inner labels: start time (left), process ID (center), end time (right)
      const startLabel = document.createElement("span");
      startLabel.classList.add("start-time");
      startLabel.textContent = p.start;

      const processLabel = document.createElement("span");
      processLabel.classList.add("process-id");
      processLabel.textContent = p.name;

      const endLabel = document.createElement("span");
      endLabel.classList.add("end-time");
      endLabel.textContent = p.end;

      block.appendChild(startLabel);
      block.appendChild(processLabel);
      block.appendChild(endLabel);
      gantt.appendChild(block);

      // Animate
      requestAnimationFrame(() => (block.style.transform = "scale(1)"));
    }, index * speed);
  });
}


function resetChart() {
  document.getElementById("ganttChart").innerHTML = "";
  document.getElementById("timeScale").innerHTML = "";
}

