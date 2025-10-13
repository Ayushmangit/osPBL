 function startSimulation() {
      const pages = document.getElementById('pages').value.trim().split(/\s+/).map(Number);
      const capacity = parseInt(document.getElementById('frames').value);
      const algo = document.getElementById('algo').value;
      if (!pages.length || capacity <= 0) return alert("Please enter valid inputs.");

      document.getElementById('output').innerHTML = "";
      document.getElementById('result').innerHTML = "";

      let frames = [];
      let hits = 0, faults = 0;

      const outputDiv = document.getElementById('output');

      pages.forEach((page, i) => {
        let hit = false;

        if (frames.includes(page)) {
          hits++;
          hit = true;
        } else {
          faults++;
          if (frames.length < capacity) {
            frames.push(page);
          } else {
            frames.shift();
            frames.push(page);
          }
        }

        const row = document.createElement('div');
        row.className = 'frame-row';
        frames.forEach(f => {
          const cell = document.createElement('div');
          cell.className = 'frame ' + (hit && f === page ? 'hit' : (!hit && f === page ? 'fault' : ''));
          cell.textContent = f;
          row.appendChild(cell);
        });
      
        for (let j = frames.length; j < capacity; j++) {
          const cell = document.createElement('div');
          cell.className = 'frame';
          row.appendChild(cell);
        }

        const stepLabel = document.createElement('div');
        stepLabel.textContent = `Page ${page} → ${hit ? 'Hit' : 'Fault'}`;
        stepLabel.style.marginBottom = '5px';
        outputDiv.appendChild(stepLabel);
        outputDiv.appendChild(row);
      });

      const hitRatio = (hits / pages.length).toFixed(2);
      const faultRatio = (faults / pages.length).toFixed(2);
      document.getElementById('result').innerHTML = `<strong>Total Pages:</strong> ${pages.length}<br> <strong>Hits:</strong> ${hits}<br>       <strong>Faults:</strong> ${faults}<br> <strong>Hit Ratio:</strong> ${hitRatio}<br> <strong>Fault Ratio:</strong> ${faultRatio}`;}