// --- Globals ---
let points = parseInt(localStorage.getItem('points')) || 500;
let userRank = localStorage.getItem('rank') || 'F';
let betX3 = parseInt(localStorage.getItem('betX3')) || 1; // 1=locked, 2=purchased
let betX3Enabled = localStorage.getItem('betX3Enabled') === "true";
let ppsLevel = parseInt(localStorage.getItem('ppsLevel')) || 0;
let ppsCost = parseInt(localStorage.getItem('ppsCost')) || 1000;
let devEnabled = false;

// --- Ranks ---
const ranks = ['F','D','C','B','A','S'];
const rankCosts = [1000,10000,100000,1000000,100000000,10000000000];

// --- DOM Setup ---
const container = document.getElementById('container');
container.innerHTML='';

// Game area
const gameArea = document.createElement('div'); gameArea.id='gameArea'; container.appendChild(gameArea);

// Shop area
const shopArea = document.createElement('div'); shopArea.id='shopArea'; shopArea.style.display='none'; container.appendChild(shopArea);

// Output
const outputDiv = document.createElement('pre'); outputDiv.id='output';
outputDiv.style.height='200px';
outputDiv.style.overflowY='scroll';
outputDiv.style.border='1px solid #0F0';
outputDiv.style.padding='10px';
outputDiv.style.backgroundColor='black';
outputDiv.style.color='#0F0';
gameArea.appendChild(outputDiv);

function appendOutput(msg){ outputDiv.innerText += msg+'\n'; outputDiv.scrollTop=outputDiv.scrollHeight; }
function overwriteOutput(msg){ let lines = outputDiv.innerText.split('\n'); lines[lines.length-1]=msg; outputDiv.innerText = lines.join('\n'); outputDiv.scrollTop=outputDiv.scrollHeight; }

// Points & rank display
const pointsDisplay = document.createElement('div');
const rankDisplay = document.createElement('div');
gameArea.appendChild(pointsDisplay);
gameArea.appendChild(rankDisplay);

function updateDisplay(){
    pointsDisplay.innerText = `Points: ${points}`;
    rankDisplay.innerText = `Rank: ${userRank}`;
}

// --- Storage ---
function saveToStorage(){
    localStorage.setItem('points', points);
    localStorage.setItem('rank', userRank);
    localStorage.setItem('betX3', betX3);
    localStorage.setItem('betX3Enabled', betX3Enabled);
    localStorage.setItem('ppsLevel', ppsLevel);
    localStorage.setItem('ppsCost', ppsCost);
    updateDisplay();
}

// --- Buttons ---
const buttonsDiv = document.createElement('div'); gameArea.appendChild(buttonsDiv);

const wheelBtn = document.createElement('button'); wheelBtn.innerText='Wheel Spin'; buttonsDiv.appendChild(wheelBtn);
const doubleBtn = document.createElement('button'); doubleBtn.innerText='Double or Nothing'; buttonsDiv.appendChild(doubleBtn);
const slotBtn = document.createElement('button'); slotBtn.innerText='Slot Machine'; buttonsDiv.appendChild(slotBtn);
const coinBtn = document.createElement('button'); coinBtn.innerText='Coin Flip'; buttonsDiv.appendChild(coinBtn);
const shopBtn = document.createElement('button'); shopBtn.innerText='Open Rank Shop'; buttonsDiv.appendChild(shopBtn);

// --- Shop ---
shopArea.innerHTML = `<h2>Shop</h2><div id="shopContent"></div><button id="shopBackBtn">Back</button>`;
const shopBackBtn = shopArea.querySelector('#shopBackBtn');
shopBackBtn.onclick = () => { shopArea.style.display='none'; gameArea.style.display='block'; updateDisplay(); }

function updateShop(){
    const shopContent = shopArea.querySelector('#shopContent');
    shopContent.innerHTML='';

    // Rank
    let idx = ranks.indexOf(userRank);
    if(idx<ranks.length-1){
        let nextRank = ranks[idx+1], cost=rankCosts[idx];
        let btn = document.createElement('button');
        btn.innerText=`Purchase rank ${nextRank} for ${cost} points`;
        btn.onclick=()=>{ 
            if(points>=cost){ points-=cost; userRank=nextRank; appendOutput(`Purchased rank ${userRank}. ${cost} spent.`); saveToStorage(); updateShop(); } 
            else appendOutput(`Need ${cost} points for ${nextRank}.`);
        }
        shopContent.appendChild(btn); shopContent.appendChild(document.createElement("br"));
    } else shopContent.innerText="Highest rank reached.";

    // Bet x3
    if(betX3===1){
        let btn = document.createElement('button');
        btn.innerText="Unlock Bet x3 for 100000 points";
        btn.onclick = () => {
            if(points >= 100000){ points -= 100000; betX3=2; betX3Enabled=false; appendOutput("Bet x3 unlocked! Toggle on/off anytime."); saveToStorage(); updateShop(); }
            else appendOutput("Need 100000 points to unlock Bet x3.");
        }
        shopContent.appendChild(btn); shopContent.appendChild(document.createElement("br"));
    } else if(betX3===2){
        let btn = document.createElement('button');
        btn.innerText = `Bet x3: ${betX3Enabled?'ON':'OFF'}`;
        btn.onclick = () => { betX3Enabled = !betX3Enabled; appendOutput(`Bet x3 ${betX3Enabled?'enabled':'disabled'}.`); saveToStorage(); updateShop();}
        shopContent.appendChild(btn); shopContent.appendChild(document.createElement("br"));
    }

    // PPS
    let btnPPS = document.createElement('button');
    btnPPS.innerText = `Buy PPS (Lv ${ppsLevel}) for ${ppsCost} points`;
    btnPPS.onclick = () => {
        if(points>=ppsCost){ points-=ppsCost; ppsLevel++; ppsCost = Math.floor(ppsCost*1.05); appendOutput(`PPS upgraded! Level ${ppsLevel}.`); saveToStorage(); updateShop(); }
        else appendOutput(`Need ${ppsCost} points for PPS.`);
    };
    shopContent.appendChild(btnPPS); shopContent.appendChild(document.createElement("br"));
}

shopBtn.onclick = () => { gameArea.style.display='none'; shopArea.style.display='block'; updateShop(); }

// --- Dev Panel ---
const devPanel = document.createElement('div');
devPanel.id='devPanel'; devPanel.style.display='none';
devPanel.style.border='1px solid #0F0'; devPanel.style.padding='5px'; devPanel.style.marginTop='10px';
devPanel.innerHTML = `
<label><input type="checkbox" id="alwaysWin"> Always Win</label><br>
Set Cash: <input type="number" id="setCashInput"><button id="setCashBtn">Apply</button>
`;
container.appendChild(devPanel);

const devBtn = document.createElement('button'); devBtn.innerText='DEV';
devBtn.style.position='fixed'; devBtn.style.bottom='5px'; devBtn.style.right='5px'; devBtn.style.fontSize='10px';
container.appendChild(devBtn);

devBtn.onclick = () => {
    let code = prompt("Enter dev code:");
    if(code==="263342690"){
        devEnabled = true;
        devPanel.style.display='block';
        appendOutput("Dev panel enabled!");
    } else alert("Incorrect code.");
};

document.getElementById('setCashBtn').onclick = () => {
    let val = parseInt(document.getElementById('setCashInput').value);
    if(!isNaN(val)){ points=val; saveToStorage(); appendOutput(`Points set to ${points} via dev panel.`);}
};

function isWinForced(){ return devEnabled && document.getElementById('alwaysWin').checked; }

// --- Bet x3 wrapper ---
function runWithBetX3(fn){ if(betX3===2 && betX3Enabled){ for(let i=0;i<3;i++) fn(); } else fn(); }

// --- Game Functions ---
function wheelSpin(){ 
    if(points<=0)return appendOutput("Wheel spin failed."); 
    const symbols=['$','!'];
    const final = isWinForced()?'$':symbols[Math.floor(Math.random()*symbols.length)];
    let steps=0, idx=0;
    const interval=setInterval(()=>{
        overwriteOutput("Wheel: ["+symbols[idx]+"]"); 
        idx=(idx+1)%symbols.length; 
        steps++;
        if(steps>15 && symbols[idx]===final){
            clearInterval(interval); 
            let prize=final==='$'?Math.floor(points*0.10):-Math.floor(points*0.10);
            points+=prize; 
            appendOutput(`Wheel stopped at [${final}]. ${prize>=0?'You gained':'You lost'} ${Math.abs(prize)} points.`); 
            saveToStorage();
        }
    },120);
}

function doubleOrNothing(){ 
    if(points<=0) return appendOutput("Double failed."); 
    if(Math.random()<0.6){ let lost=points; points=0; appendOutput(`Double lost. ${lost} points lost.`);} 
    else{points*=2; appendOutput("Double won. Points doubled.");} 
    saveToStorage();
}

function slotMachine(){ 
    if(points<=0)return appendOutput("Slot failed."); 
    const symbols=['$','!','$','!','$','!','$','$','!','$']; 
    const reels=5; 
    let final=[]; 
    for(let i=0;i<reels;i++) final.push(symbols[Math.floor(Math.random()*symbols.length)]); 
    let steps=0; 
    const interval=setInterval(()=>{
        overwriteOutput("Slot: "+final.join(' ')); 
        steps++; 
        if(steps>15){
            clearInterval(interval); 
            let prize=0; 
            final.forEach(s=>{if(s==='$') prize+=Math.floor(points*0.05); if(s==='!') prize-=Math.floor(points*0.05);}); 
            points+=prize; 
            appendOutput(`Slot stopped: ${final.join(' ')}. ${prize>=0?'You gained':'You lost'} ${Math.abs(prize)} points.`); 
            saveToStorage();
        }
    },150);
}

function coinFlip(){ 
    if(points<=0)return appendOutput("CF failed."); 
    let bet=10; 
    let win=isWinForced() || Math.random()>=0.55; 
    if(win){points+=bet; appendOutput(`CF won. ${bet} points gained.`);} 
    else{points-=bet; appendOutput(`CF lost. ${bet} points lost.`);} 
    saveToStorage();
}

// Attach buttons
wheelBtn.onclick=()=>runWithBetX3(wheelSpin);
doubleBtn.onclick=()=>runWithBetX3(doubleOrNothing);
slotBtn.onclick=()=>runWithBetX3(slotMachine);
coinBtn.onclick=()=>runWithBetX3(coinFlip);

// --- PPS auto-gain ---
setInterval(()=>{ 
    if(ppsLevel>0){ 
        let gain=Math.floor(points*(ppsLevel*0.02)); 
        points+=gain; 
        appendOutput(`PPS +${gain} points (Lv ${ppsLevel}).`); 
        saveToStorage(); 
    } 
},1000);

// --- Initial Display ---
updateDisplay();
appendOutput("Welcome to C.A.S.I.N.O!");
