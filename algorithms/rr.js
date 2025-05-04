export function calculateRR(processes, timeQuantum) {
  timeQuantum = Number(timeQuantum);
  const n = processes.length;
  const completed = [];
  const remaining = processes.map((p) => ({
    ...p,
    remaining: p.burst,
    start: null,
  }));
  const ganttChart = [];
  const readyQueue = [];
  const addedToQueue = new Set();

  let currentTime = 0;
  let totalIdle = 0;

  while (completed.length < n && remaining.some((p) => p.remaining > 0)) {
    // Add newly arrived processes to readyQueue
    remaining
      .filter(
        (p) =>
          p.arrival <= currentTime &&
          !addedToQueue.has(p.process) &&
          p.remaining > 0
      )
      .sort((a, b) => a.arrival - b.arrival)
      .forEach((p) => {
        readyQueue.push(p);
        addedToQueue.add(p.process);
      });

    if (readyQueue.length === 0) {
      // CPU is idle, jump to the next arriving process
      const future = remaining.filter(
        (p) => p.remaining > 0 && p.arrival > currentTime
      );
      if (future.length > 0) {
        const nextArrival = Math.min(...future.map((p) => p.arrival));
        ganttChart.push({
          label: "i",
          start: currentTime,
          end: nextArrival,
          rbt: null,
          queue: [],
          arrived: future
            .filter((p) => p.arrival <= nextArrival)
            .map((p) => ({ process: p.process })),
        });
        totalIdle += nextArrival - currentTime;
        currentTime = nextArrival;
        continue;
      } else {
        break; // No more processes to run
      }
    }

    const p = readyQueue.shift();
    if (!p || p.remaining <= 0) continue;

    if (p.start === null) {
      p.start = currentTime;
    }

    const execTime = Math.min(timeQuantum, p.remaining);
    const start = currentTime;
    const end = currentTime + execTime;

    p.remaining -= execTime;
    currentTime = end;

    // Add any arrived processes not already added
    remaining
      .filter(
        (proc) =>
          proc.arrival <= currentTime &&
          proc.remaining > 0 &&
          !addedToQueue.has(proc.process)
      )
      .sort((a, b) => a.arrival - b.arrival)
      .forEach((proc) => {
        readyQueue.push(proc);
        addedToQueue.add(proc.process);
      });

    ganttChart.push({
      label: p.process,
      start,
      end,
      rbt: p.remaining,
      queue: readyQueue
        .filter((q) => q.remaining > 0)
        .map(({ process, remaining, arrival }) => ({
          process,
          remaining,
          arrival,
        })),
    });

    if (p.remaining > 0) {
      readyQueue.push(p); // Re-add to queue if not finished
    } else {
      const turnaround = currentTime - p.arrival;
      const waiting = turnaround - p.burst;
      completed.push({
        ...p,
        completion: currentTime,
        turnaround,
        waiting,
      });
    }
  }

  return {
    result: completed,
    ganttChart,
    totalTime: currentTime,
    totalIdle,
  };
}
