// index.js - FIFO, LRU, Optimal visualization with step/auto run
let autoMode = false;
let stepMode = false;
let stopRequested = false;

function parseInput() {
  const pages = document.getElementById('pages').value.trim();
  if (!pages) return [];
  return pages.split(/\s+/).map(s => Number(s)).filter(n => !Number.isNaN(n));
}

function setResult(html) { document.getElementById('result').innerHTML = html; }
function clearOutput() {
  document.getElementById('output').innerHTML = '';
  setResult('');
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function startSimulation() {
  stopRequested = false;
  stepMode = false;
  autoMode = true;
  await run(false);
}

async function startStepByStep() {
  stopRequested = false;
  stepMode = true;
  autoMode = false;
  await run(true);
}

function resetSimulation() {
  stopRequested = true;
  autoMode = false;
  stepMode = false;
  clearOutput();
  setResult('');
  document.getElementById('runBtn').disabled = false;
  document.getElementById('stepBtn').disabled = false;
  document.getElementById('button')?.removeAttribute('disabled');
}

// main runner
async function run(stepModeRequested) {
  const pages = parseInput();
  const capacity = parseInt(document.getElementById('frames').value) || 1;
  const algo = document.getElementById('algo').value;
  if (!pages.length || capacity <= 0) { alert('Please enter valid input.'); return; }

  document.getElementById('runBtn').disabled = true;
  document.getElementById('stepBtn').disabled = true;
  clearOutput();

  const delay = () => Number(document.getElementById('speed').value);
  let frames = [];                 // current frames for visualization
  let hits = 0, faults = 0;
  const outputDiv = document.getElementById('output');

  // algorithm-specific helpers
  // FIFO uses queue array (frames as queue)
  // LRU uses Map to record last used time
  // OPT uses lookahead to remove page with farthest next use

  const recordStep = (page, isHit) => {
    const stepRow = document.createElement('div');
    stepRow.className = 'frame-row';

    const label = document.createElement('div');
    label.className = 'labelCell';
    label.textContent = `Page ${page} → ${isHit ? 'Hit' : 'Fault'}`;
    stepRow.appendChild(label);

    // create frame cells
    for (let f of frames) {
      const cell = document.createElement('div');
      cell.className = 'frame ' + (isHit && f === page ? 'hit' : (!isHit && f === page ? 'fault' : ''));
      cell.textContent = f;
      stepRow.appendChild(cell);
    }
    // empty cells if frames less than capacity
    for (let i = frames.length; i < capacity; i++) {
      const cell = document.createElement('div');
      cell.className = 'frame';
      cell.textContent = '';
      stepRow.appendChild(cell);
    }

    outputDiv.appendChild(stepRow);
    // auto-scroll to bottom
    outputDiv.scrollTop = outputDiv.scrollHeight;
  };

  // helpers for algorithms
  function lruReplace(pageIndex, pagesArr) {
    // find least recently used among frames by scanning backward from current index-1
    let lruFrame = frames[0], oldest = Infinity;
    for (let f of frames) {
      // find last occurrence index of f before current pageIndex
      let last = -1;
      for (let j = pageIndex - 1; j >= 0; j--) {
        if (pagesArr[j] === f) { last = j; break; }
      }
      if (last === -1) last = -Infinity; // never used => oldest
      if (last < oldest) { oldest = last; lruFrame = f; }
    }
    return lruFrame;
  }

  function optimalReplace(pageIndex, pagesArr) {
    // choose frame whose next use is farthest (or never used)
    let victim = frames[0], farthest = -1;
    for (let f of frames) {
      let next = Infinity;
      for (let k = pageIndex + 1; k < pagesArr.length; k++) {
        if (pagesArr[k] === f) { next = k; break; }
      }
      if (next === Infinity) { // never used again -> best victim
        return f;
      }
      if (next > farthest) { farthest = next; victim = f; }
    }
    return victim;
  }

  // main loop
  for (let idx = 0; idx < pages.length; idx++) {
    if (stopRequested) break;
    const page = pages[idx];
    let isHit = frames.includes(page);

    if (isHit) {
      hits++;
    } else {
      faults++;
      if (frames.length < capacity) {
        frames.push(page);
      } else {
        // pick victim depending on algo
        if (algo === 'FIFO') {
          frames.shift();
          frames.push(page);
        } else if (algo === 'LRU') {
          const victim = lruReplace(idx, pages);
          // replace first occurrence of victim in frames
          const pos = frames.indexOf(victim);
          frames[pos] = page;
        } else if (algo === 'OPT') {
          const victim = optimalReplace(idx, pages);
          const pos = frames.indexOf(victim);
          frames[pos] = page;
        }
      }
    }

    // record and optionally animate / delay
    recordStep(page, isHit);

    if (stepModeRequested) {
      // in step mode, wait for user to press "Step" again — we simulate by enabling runBtn to allow continue
      // simpler approach: wait for a click on stepBtn
      await waitForStepOrTimeout(delay());
      if (stopRequested) break;
    } else {
      await sleep(delay());
    }
  }

  const hitRatio = (hits / pages.length).toFixed(2);
  const faultRatio = (faults / pages.length).toFixed(2);
  setResult(`<strong>Total Pages:</strong> ${pages.length}<br>
    <strong>Hits:</strong> ${hits}<br>
    <strong>Faults:</strong> ${faults}<br>
    <strong>Hit Ratio:</strong> ${hitRatio}<br>
    <strong>Fault Ratio:</strong> ${faultRatio}`);
  document.getElementById('runBtn').disabled = false;
  document.getElementById('stepBtn').disabled = false;
}

// wait for the user to click Step again or until timeout (so step mode still supports an optional auto timeout)
function waitForStepOrTimeout(timeoutMs) {
  return new Promise(resolve => {
    let resolved = false;
    const stepBtn = document.getElementById('stepBtn');

    function onStep() {
      if (!resolved) { resolved = true; stepBtn.removeEventListener('click', onStep); resolve(); }
    }
    stepBtn.addEventListener('click', onStep);

    const t = setTimeout(() => {
      if (!resolved) { resolved = true; stepBtn.removeEventListener('click', onStep); resolve(); }
    }, timeoutMs);

    // allow cancellation
    const cleanup = () => { clearTimeout(t); stepBtn.removeEventListener('click', onStep); };
    // ensure cleanup when resolved
    resolve.cleanup = cleanup;
  });
}
