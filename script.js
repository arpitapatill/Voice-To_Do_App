
// Elements
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const voiceBtn = document.getElementById("voiceBtn");
const statusEl = document.getElementById("status");
const lastTranscriptEl = document.getElementById("lastTranscript");
const confidenceEl = document.getElementById("confidence");
const todoList = document.getElementById("todoList");

// Load & render tasks
let tasks = JSON.parse(localStorage.getItem("tasks_v2") || "[]");
renderTasks();

function renderTasks() {
  todoList.innerHTML = "";
  tasks.forEach((task, i) => {
    const li = document.createElement("li");
    if (task.done) li.classList.add("done");
    li.innerHTML = `
      <span class="task-text">${i + 1}. ${escapeHtml(task.text)}</span>
      <div class="actions">
        <button onclick="toggleDone(${i})">✅</button>
        <button onclick="deleteTask(${i})">🗑️</button>
      </div>
    `;
    todoList.appendChild(li);
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function saveTasks(){ localStorage.setItem("tasks_v2", JSON.stringify(tasks)); }
function addTask(text){ if(!text.trim()) return false; tasks.push({text,done:false}); saveTasks(); renderTasks(); return true; }
function deleteTask(i){ tasks.splice(i,1); saveTasks(); renderTasks(); }
function toggleDone(i){ tasks[i].done=!tasks[i].done; saveTasks(); renderTasks(); }

addBtn.addEventListener("click", ()=>{ if(addTask(taskInput.value)) taskInput.value=""; });
taskInput.addEventListener("keydown", e=>{ if(e.key==="Enter") if(addTask(taskInput.value)) taskInput.value=""; });

/* SPEECH RECOGNITION - unchanged */
let recognition=null,isListening=false,audioCtx=null;
function setStatus(t){ statusEl.textContent=t; }
function setTranscript(t,c){ lastTranscriptEl.textContent=t||"—"; confidenceEl.textContent=c!=null?`Confidence: ${(c*100).toFixed(0)}%`:""; }

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
if(!SpeechRecognition){
  voiceBtn.disabled=true;
  setStatus("Speech Recognition not supported.");
}else{
  recognition=new SpeechRecognition();
  recognition.lang="en-US"; recognition.interimResults=false; recognition.maxAlternatives=2;

  recognition.onstart=()=>{ isListening=true; voiceBtn.textContent="🎤 Listening..."; setStatus("Listening..."); };
  recognition.onend=()=>{ isListening=false; voiceBtn.textContent="🎤 Speak"; setStatus("Microphone ready"); };
  recognition.onresult=e=>{
    const r=e.results[0][0]; setTranscript(r.transcript,r.confidence);
    setTimeout(()=>handleVoiceCommand(r.transcript.toLowerCase()),150);
  };
}

voiceBtn.addEventListener("click", async ()=>{
  if(!recognition) return;
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==="suspended") await audioCtx.resume();
  isListening ? recognition.stop() : recognition.start();
});

function handleVoiceCommand(t){
  t=t.trim();
  if(/^clear all/.test(t)){ tasks=[]; saveTasks(); renderTasks(); setStatus("All tasks cleared."); return; }
  const add=t.match(/^add task (.+)/)||t.match(/^add (.+)/);
  if(add){ addTask(add[1]); setStatus(`Added: ${add[1]}`); return; }
  const del=t.match(/^delete task (\d+)/)||t.match(/^remove task (\d+)/);
  if(del){ const i=del[1]-1; tasks[i]&&deleteTask(i); setStatus("Task deleted"); return; }
  const done=t.match(/^mark task (\d+) done/);
  if(done){ const i=done[1]-1; tasks[i]&&(tasks[i].done=true); saveTasks(); renderTasks(); setStatus("Marked done"); return; }
  if(t.split(" ").length<=5){ addTask(t); setStatus(`Added: ${t}`); return; }
  setStatus("Command not recognized.");
}

window.deleteTask=deleteTask;
window.toggleDone=toggleDone;
