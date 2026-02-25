let currentInput = null;

function setFocus(el) { currentInput = el; }
function keyClick(n) { if(currentInput) currentInput.value = (currentInput.value == "0" ? n : currentInput.value + n); }
function keyClear() { if(currentInput) currentInput.value = ""; }
function keyDel() { if(currentInput) currentInput.value = currentInput.value.slice(0,-1) || "0"; }

function togglePriorityUI() {
    const isPrio = document.getElementById('algoSelect').value === 'Priority';
    document.getElementById('prioOrderCont').style.display = isPrio ? 'block' : 'none';
    document.querySelector('.prio-head').style.display = isPrio ? 'table-cell' : 'none';
    document.querySelectorAll('.prio-cell').forEach(c => c.style.display = isPrio ? 'table-cell' : 'none');
}

function addRow() {
    const tbody = document.getElementById('processBody');
    const isPrio = document.getElementById('algoSelect').value === 'Priority';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type="text" value="P${tbody.rows.length + 1}" readonly></td>
        <td><input type="number" class="at" value="0" onclick="setFocus(this)"></td>
        <td><input type="number" class="bt" value="1" onclick="setFocus(this)"></td>
        <td class="prio-cell" style="display:${isPrio ? 'table-cell' : 'none'}"><input type="number" class="priority" value="0" onclick="setFocus(this)"></td>`;
    tbody.appendChild(tr);
}

function refreshPage() {
    if(confirm("Are you sure you want to clear all data?")) {
        location.reload();
    }
}

function simulate() {
    const algo = document.getElementById('algoSelect').value;
    const prioOrder = document.getElementById('priorityOrder').value;
    const rows = document.querySelectorAll('#processBody tr');
    let processes = Array.from(rows).map(row => ({
        id: row.cells[0].querySelector('input').value,
        at: parseInt(row.querySelector('.at').value) || 0,
        bt: parseInt(row.querySelector('.bt').value) || 1,
        priority: parseInt(row.querySelector('.priority')?.value) || 0,
        done: false
    }));

    // Simple validation
    if (processes.some(p => p.bt <= 0)) {
        alert("Burst time must be greater than 0");
        return;
    }

    let currentTime = 0, completed = 0, schedule = [];

    while (completed < processes.length) {
        let ready = processes.filter(p => p.at <= currentTime && !p.done);

        if (ready.length > 0) {
            if (algo === "FCFS") {
                ready.sort((a, b) => a.at - b.at);
            } else if (algo === "SJFS") {
                ready.sort((a, b) => a.bt - b.bt || a.at - b.at);
            } else if (algo === "Priority") {
                ready.sort((a, b) => (prioOrder === "low" ? a.priority - b.priority : b.priority - a.priority) || a.at - b.at);
            }

            let p = ready[0];
            schedule.push({ id: p.id, start: currentTime, end: currentTime + p.bt });
            currentTime += p.bt;
            p.ct = currentTime;
            p.tat = p.ct - p.at;
            p.wt = p.tat - p.bt;
            p.done = true;
            completed++;
        } else {
            let nextAt = Math.min(...processes.filter(p => !p.done).map(p => p.at));
            schedule.push({ id: "Idle", start: currentTime, end: nextAt, idle: true });
            currentTime = nextAt;
        }
    }
    renderOutput(processes, schedule, algo);
}

function renderOutput(processes, schedule, algo) {
    document.getElementById('outputSection').style.display = 'block';
    document.getElementById('ganttTitle').innerText = `Gantt Chart: ${algo}`;
    const gantt = document.getElementById('ganttContainer');
    gantt.innerHTML = "";
    
    schedule.forEach((b, i) => {
        const div = document.createElement('div');
        div.className = `gantt-block ${b.idle ? 'idle' : ''}`;
        div.style.flex = b.end - b.start;
        div.innerHTML = `<span>${b.id}</span>`;
        if (i === 0) div.innerHTML += `<span class="time" style="left:0">${b.start}</span>`;
        div.innerHTML += `<span class="time end-time">${b.end}</span>`;
        gantt.appendChild(div);
    });

    let totalWT = 0;
    let table = `<table><tr><th>PID</th><th>AT</th><th>BT</th><th>CT</th><th>TAT</th><th>WT</th></tr>`;
    processes.forEach(p => {
        totalWT += p.wt;
        table += `<tr><td>${p.id}</td><td>${p.at}</td><td>${p.bt}</td><td>${p.ct}</td><td>${p.tat}</td><td>${p.wt}</td></tr>`;
    });
    
    document.getElementById('resultTableContainer').innerHTML = table + `</table>
        <p><b>Average Waiting Time:</b> ${(totalWT / processes.length).toFixed(2)}ms</p>`;
}