(() => {
  const container = document.getElementById("container");
  container.innerHTML = ''; // clear old UI

  // --- Variables ---
  const ONE_HOUR = 1000 * 60 * 60;
  const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

  let points = parseInt(localStorage.getItem('points')) || 500;
  let userRank = localStorage.getItem('rank') || "F";
  let devEnabled = false;
  let lastActive = parseInt(localStorage.getItem('lastActive')) || Date.now();
  const ranks = ["F","D","C","B","A","S"];
  const rankCosts = [1000,10000,100000,1000000,100000000,10000000000];

  // --- Handle offline earnings & 1-week reset ---
  const now = Date.now();
  if(now - lastActive > ONE_WEEK) {
    points = 500; // reset after 1 week inactivity
  } else {
    const hoursElapsed = Math.floor((now - lastActive)/ONE_HOUR);
    if(hoursElapsed > 0) points += hoursElapsed * 10; // 10 points per offline hour
  }
  localStorage.setItem('lastActive', now);

  // --- Build UI ---
  container.innerHTML = `
    <h1>C.a.s.i.n.o</h1>
    <div id="gameUI">
      <div>Points: <span id="pointsDisplay">${points}</span> | Rank: <span id="rankDisplay">${userRank}</span></div>
      <div>
        <button id="wheelBtn">Wheel Spin</button>
        <button id="doubleBtn">Double or Nothing</button>
        <button id="slotBtn">Slot Machine</button>
        <button id="shopBtn">Open Rank Shop</button>
      </div>
      <div>
        Coin Flip: Bet <input type="range" id="betSlider" min="1" max="${points}" value="10">
        <span id="betAmount">10</span> points
        <button id="coinBtn">Flip Coin</button>
      </div>
      <pre id="output"></pre>
    </div>

    <div id="shop">
      <h3>Rank Shop</h3>
      <div id="shopContent"></div>
      <button id="backBtn">Back</button>
    </div>

    <div id="devPanel">
      <label><input type="checkbox" id="alwaysWin"> Always Win</label><br>
      Set Cash: <input type="number" id="setCashInput"><button id="setCashBtn">Apply</button>
    </div>
    <button id="devBtn">DEV</button>
  `;

  // --- Element references ---
  const pointsDisplay = document.getElementById("pointsDisplay");
  const rankDisplay = document.getElementById("rankDisplay");
  const betSlider = document.getElementById("betSlider");
  const betAmount = document.getElementById("betAmount");
  const outputDiv = document.getElementById("output");
  const gameUI = document.getElementById("gameUI");
  const shop = document.getElementById("shop");
  const shopContent = document.getElementById("shopContent");
  const devPanel = document.getElementById("devPanel");

  // --- Storage ---
  function save() {
    localStorage.setItem('points', points);
    localStorage.setItem('rank', userRank);
    localStorage.setItem('lastActive', Date.now());
    updateDisplay();
  }
  function updateDisplay() {
    pointsDisplay.innerText = points;
    rankDisplay.innerText = userRank;
    betSlider.max = points>0?points:1;
    if(betSlider.value>points) betSlider.value=points;
    betAmount.innerText = betSlider.value;
  }

  // --- Output ---
  function appendOutput(msg) {
    outputDiv.innerText += msg + "\n";
    outputDiv.scrollTop = outputDiv.scrollHeight;
  }
  function overwriteOutput(msg) {
    let lines = outputDiv.innerText.split("\n");
    lines[lines.length-1] = msg;
    outputDiv.innerText = lines.join("\n");
    outputDiv.scrollTop = outputDiv.scrollHeight;
  }

  // --- Dev ---
  function showDev() {
    let code = prompt("Enter dev code:");
    if(code==="263342690") { devEnabled=true; devPanel.style.display='block'; appendOutput("Dev panel enabled."); }
    else alert("Incorrect code.");
  }
  function setCash() {
    let val = parseInt(document.getElementById("setCashInput").value);
    if(!isNaN(val)) { points=val; save(); appendOutput(`Points set to ${points} via dev panel.`);}
  }
  function isWinForced(){ return devEnabled && document.getElementById("alwaysWin").checked; }

  // --- Game ---
  function wheelSpin() {
    if(points<=0) return appendOutput("Wheel spin failed. 0 points.");
    const symbols=['$','!'];
    const final = isWinForced()?'$':symbols[Math.floor(Math.random()*symbols.length)];
    let steps=0, idx=0;
    const interval = setInterval(()=>{
      overwriteOutput("Wheel: ["+symbols[idx]+"]");
      idx=(idx+1)%symbols.length;
      steps++;
      if(steps>15 && symbols[idx]===final){
        clearInterval(interval);
        let prize = final==='$'?Math.floor(points*0.10):-Math.floor(points*0.10);
        points += prize;
        appendOutput(`Wheel stopped at [${final}]. ${prize>=0?'You gained':'You lost'} ${Math.abs(prize)} points.`);
        save();
      }
    },120);
  }

  function doubleOrNothing() {
    if(points<=0) return appendOutput("Double failed.");
    if(Math.random()<0.6) { let lost=points; points=0; appendOutput(`Double lost. ${lost} points lost.`);}
    else { points*=2; appendOutput("Double won. Points doubled."); }
    save();
  }

  function slotMachine() {
    if(points<=0) return appendOutput("Slot failed.");
    const symbols=['$','!','$','!','$','!'];
    let final=[];
    for(let i=0;i<5;i++){ final.push(isWinForced()?'$':symbols[Math.floor(Math.random()*symbols.length)]); }
    let prize=0;
    final.forEach(s=>{ if(s==='$') prize+=Math.floor(points*0.05); if(s==='!') prize-=Math.floor(points*0.05); });
    points += prize;
    appendOutput("Slot stopped: "+final.join(" ") + `. ${prize>=0?'You gained':'You lost'} ${Math.abs(prize)} points.`);
    save();
  }

  function coinFlip() {
    if(points<=0) return appendOutput("CF failed.");
    let bet=parseInt(betSlider.value);
    if(bet>points) bet=points;
    let win=isWinForced()||Math.random()>=0.55;
    if(win){ points+=bet; appendOutput(`CF won. ${bet} points gained.`);}
    else { points-=bet; appendOutput(`CF lost. ${bet} points lost.`);}
    save();
  }

  // --- Shop ---
  function openShop() {
    gameUI.style.display='none';
    shop.style.display='block';
    updateShop();
  }
  function closeShop() { shop.style.display='none'; gameUI.style.display='block'; }
  function updateShop() {
    shopContent.innerHTML='';
    let idx=ranks.indexOf(userRank);
    if(idx>=ranks.length-1){ shopContent.innerText="Highest rank reached."; return; }
    let nextRank=ranks[idx+1], cost=rankCosts[idx];
    let btn=document.createElement('button');
    btn.innerText=`Purchase rank ${nextRank} for ${cost} points`;
    btn.onclick=()=>{ if(points>=cost){ points-=cost; userRank=nextRank; appendOutput(`Purchased rank ${userRank}. ${cost} spent.`); save(); updateShop();} else appendOutput(`Not enough points for ${nextRank}. Need ${cost}.`);}
    shopContent.appendChild(btn);
  }

  // --- Listeners ---
  betSlider.oninput = ()=>betAmount.innerText=betSlider.value;
  document.getElementById("wheelBtn").onclick=wheelSpin;
  document.getElementById("doubleBtn").onclick=doubleOrNothing;
  document.getElementById("slotBtn").onclick=slotMachine;
  document.getElementById("coinBtn").onclick=coinFlip;
  document.getElementById("shopBtn").onclick=openShop;
  document.getElementById("backBtn").onclick=closeShop;
  document.getElementById("devBtn").onclick=showDev;
  document.getElementById("setCashBtn").onclick=setCash;

  updateDisplay();
  appendOutput(`Game loaded. Points: ${points}. Rank: ${userRank}`);
})();
