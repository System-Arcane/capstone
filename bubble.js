// The ideal-gas demonstration uses relative states at fixed temperature.
// It is deliberately independent of the Moldflow results and trained models.
const bubbleState = { mode: 'process', progress: 0, playing: false, frame: 0, last: 0,
  axis: 1, fixed: [1,205,150,90], from: 190, to: 220, pressure: 6 };

function bubbleRatios(mode, progress) {
  const volume = 1 - .5 * Math.max(0, Math.min(1, progress));
  const gas = volume;
  return { gas, volume, radius: Math.cbrt(volume), density: gas / volume, pressure: gas / volume };
}

function stopBubbleMotion() {
  cancelAnimationFrame(bubbleState.frame);
  if(typeof radiusLab!=='undefined'){cancelAnimationFrame(radiusLab.frame);radiusLab.playing=false;}
  bubbleState.playing = false;
  bubbleState.last = 0;
}

function specimenDiagram() {
  // Regularly separated cells are illustrative geometry, not measured cell positions.
  const cells = [];
  for (let row=0; row<4; row++) for (let col=0; col<12; col++) {
    const x=64+col*29+(row%2)*10, y=215+row*18, r=4+(row*7+col*3)%4;
    if(x<408)cells.push(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.8}" fill="#8da2af" stroke="#ecf2f5" stroke-width="1.2"/>`);
  }
  return `<svg class="specimen-art" viewBox="0 0 480 360" role="img" aria-label="단단한 원판형 시편의 절단 모식도. 내부 셀 한 곳을 선택하여 확대합니다.">
  <defs><linearGradient id="specimenTop" x2=".2" y2="1"><stop stop-color="#f6f8fa"/><stop offset="1" stop-color="#acbcc9"/></linearGradient><linearGradient id="specimenSide" x2="0" y2="1"><stop stop-color="#a9bac8"/><stop offset="1" stop-color="#667e92"/></linearGradient><linearGradient id="specimenCut" x2="0" y2="1"><stop stop-color="#e1e8ed"/><stop offset="1" stop-color="#adbecb"/></linearGradient><clipPath id="sectionClip"><path d="M44 202 Q240 238 436 202 L436 264 Q240 312 44 264Z"/></clipPath></defs>
  <g stroke="#bfd7ec" opacity=".09"><path d="M30 90H450M30 130H450M30 170H450M30 210H450M30 250H450M30 290H450"/><path d="M80 65V330M160 65V330M240 65V330M320 65V330M400 65V330"/></g>
  <ellipse cx="240" cy="297" rx="184" ry="25" fill="#081523" opacity=".35"/>
  <path d="M44 168 A196 73 0 0 1 436 168 V236 A196 73 0 0 1 44 236Z" fill="url(#specimenSide)" stroke="#c4d0d9"/>
  <ellipse cx="240" cy="168" rx="196" ry="73" fill="url(#specimenTop)" stroke="#dce6ed" stroke-width="2"/>
  <path d="M44 202 Q240 238 436 202 L436 264 Q240 312 44 264Z" fill="url(#specimenCut)" stroke="#cfdce5"/>
  <g clip-path="url(#sectionClip)">${cells.join('')}</g>
  <path d="M44 202 Q240 238 436 202 M44 264 Q240 312 436 264" fill="none" stroke="#ecf2f5" stroke-width="5"/>
  <circle cx="278" cy="247" r="19" fill="#3f99d722" stroke="#77c5f7" stroke-width="2"/>
  <circle cx="278" cy="247" r="7" fill="#5b758a" stroke="#e8f4ff" stroke-width="1.5"/>
  <path d="M292 232 L357 90 H431" fill="none" stroke="#77c5f7" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="430" y="79" fill="#b9e2fd" text-anchor="end" font-size="12">버블 확대</text>
  <path d="M150 127 L107 72 H48" fill="none" stroke="#98b0c3"/>
  <text x="48" y="60" fill="#b7cbdc" font-size="12">치밀한 표면층</text>
  <text x="240" y="340" text-anchor="middle" fill="#8ca7bc" font-size="11">내부 셀을 확대해 표현한 구조 모식도</text></svg>`;
}

function bubbleNavigation(mode) {
 return '<nav class="bubble-modes" aria-label="버블 비교 방식">'+[['process','포밍 공정'],['both','압력·반지름'],['focus','온도·밀도'],['actual','해석값 비교']].map(([key,label])=>`<button data-bubble-mode="${key}" onclick="showBubble('${key}')" class="${mode===key?'active':''}" aria-pressed="${mode===key}">${label}</button>`).join('')+'</nav>';
}

function showBubble(mode=bubbleState.mode){
 setPage('bubble');document.body.classList.remove('heat','prediction','video-page');document.body.classList.add('bubble-page');
 document.querySelector('.controls').hidden=true;$('heatControls').hidden=true;bubbleState.mode=mode;bubbleState.progress=mode==='process'?0:1;
 const steps=['process','both','focus','actual'],i=steps.indexOf(mode);
 $('charts').innerHTML=`<section class="easy-workbench"><div class="bubble-toolbar">${bubbleNavigation(mode)}</div><section id="bubbleDetail" class="easy-content"></section>
 <div class="easy-navigation"><button onclick="showBubble('${steps[Math.max(0,i-1)]}')" ${i===0?'disabled':''}>이전</button><span>${i+1} / 4 · ${i===0?'공식 공정 설명':i===1?'이해를 위한 가정':'Moldflow 해석 데이터'}</span><button onclick="showBubble('${steps[Math.min(3,i+1)]}')" ${i===3?'disabled':''}>다음</button></div></section>`;
 if(mode==='process')drawFoamingProcess();else if(mode==='both')drawBubblePrinciple();else if(mode==='focus')drawDensityOverview();else drawBubbleComparison();
}
function easyHeading(question,context){return `<div class="easy-heading"><h2>${question}</h2><p>${context}</p></div>`;}
function drawDensityOverview(){
 $('bubbleDetail').innerHTML=easyHeading('온도를 높이면, 내부 밀도는 어떻게 달라질까?','CBA 1% · 속도 150 mm/s · V/P 90%는 같게 두고 비교')+
 `<div class="density-common"><span>세 조건 모두 같은 치수</span><strong>지름 108 mm × 두께 3.2 mm</strong><b>전체 체적 ${specimenVolume.toFixed(3)} cm³</b></div>
 <div class="density-cards">${focusRows.map(r=>`<article class="density-case"><h3>${r[1]}℃</h3><svg viewBox="0 0 240 110" role="img" aria-label="같은 치수의 원형 시편"><path d="M35 45A85 25 0 0 1 205 45V65A85 25 0 0 1 35 65Z" fill="#9cbdd7" stroke="#7599b7"/><ellipse cx="120" cy="45" rx="85" ry="25" fill="#d2e3f0" stroke="#7599b7"/></svg><span>내부 밀도 <small>(코어밀도)</small></span><strong>${r[9].toFixed(4)}<small> g/cm³</small></strong><div class="core-density-meter" role="img" aria-label="코어밀도 공통 눈금 0에서 1, ${r[9]} g/cm³"><i style="width:${r[9]*100}%"></i></div><div class="core-density-scale"><span>0</span><span>1 g/cm³</span></div><p>시편 중량 ${r[4].toFixed(2)} g</p></article>`).join('')}</div>
 <div class="easy-answer">이 세 조건에서는 온도가 높을수록 <b>내부 밀도가 낮아졌음.</b></div>
 <p class="easy-note">여기서 밀도는 <b>내부 폼의 밀도</b>입니다. 기포 속 가스의 밀도는 아닙니다.</p>
 <details class="easy-details" ontoggle="if(this.open)drawBubbleFocusCharts()"><summary>전체 그래프·체적 계산 보기</summary><p>전체 시편 체적 V = π × (10.8 / 2)² × 0.32 = 29.315 cm³. 개별 기포의 체적과는 다릅니다.</p><label>버블 압력 <select id="bubbleFocusPressure" onchange="drawBubbleFocusCharts()"><option value="6">최대</option><option value="7">평균</option></select></label><div id="bubbleFocusCharts"></div></details>`;
}
function drawBubbleFocusCharts(){const target=$('bubbleFocusCharts');if(target&&target.closest('details').open)render(true,1,target,$('bubbleFocusPressure').value);}

// Equal distribution in the same comparison region. Final T and P are assumed equal.


function gasPartition(cellCount,totalGas=80,referenceCount=4){
  const volume=referenceCount/cellCount;
  return {cellCount,totalGas,gasPerCell:totalGas/cellCount,volume,radius:Math.cbrt(volume)};
}
// This is a prescribed-state ideal-gas comparison, not a bubble-growth solver.
const radiusLab={radius:Math.cbrt(.5),frame:0,playing:false};
function radiusState(radius,gas){const volume=radius**3;return {radius,gas,volume,pressure:gas/volume};}
function drawBubblePrinciple(){
 $('bubbleDetail').classList.add('radius-lab');
 $('bubbleDetail').innerHTML=`<div class="radius-lab-heading"><h2>같은 크기, 다른 압력</h2><span>온도 동일 · 설명 모형</span></div>
 <div class="radius-presets" aria-label="반지름 비교 장면"><button onclick="setRadiusScene('small')">작은 셀</button><button onclick="setRadiusScene('base')">기준 크기</button><button onclick="setRadiusScene('large')">큰 셀</button><button id="radiusPlay" onclick="playRadiusScene()">▶ 변화 보기</button></div>
 <div id="radiusComparison" class="radius-comparison"></div>
 <div class="radius-control"><label for="radiusInput">비교 셀 반지름</label><span>작게</span><input id="radiusInput" type="range" min="65" max="115" step="0.1" value="${radiusLab.radius*100}" oninput="setLabRadius(+this.value/100)"/><span>크게</span><output id="radiusOutput"></output></div>
 <div class="radius-takeaway"><span>같은 반지름</span><strong>가스가 더 많이 들어 있으면, 압력이 더 높음</strong></div>
 <details class="easy-details"><summary>계산·가정 보기</summary><p>온도가 일정한 이상기체에서 압력은 가스량 ÷ 체적에 비례합니다. 셀을 구로 가정하면 체적은 반지름의 세제곱에 비례합니다.</p><p>기준은 반지름·가스량·체적·압력을 모두 1로 둡니다. 가운데는 가스량을 1로 유지하고, 오른쪽은 가스량을 체적과 같은 비율로 바꿉니다. 체적을 절반으로 정하면 반지름은 약 0.794배이며, 압력은 각각 2배와 1배입니다.</p><p>체적을 정해 놓고 비교하는 모형입니다. 수지의 점도·주변 압력·냉각을 포함한 실제 셀 성장 해석이나 측정된 원인 검증이 아닙니다.</p><a href="https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/equation-of-state/" target="_blank" rel="noopener noreferrer">이상기체식 근거</a></details>`;
 updateRadiusLab();
}
function setLabRadius(r){cancelAnimationFrame(radiusLab.frame);radiusLab.playing=false;radiusLab.radius=Math.max(.65,Math.min(1.15,r));updateRadiusLab();}
function setRadiusScene(scene){setLabRadius(scene==='small'?Math.cbrt(.5):scene==='large'?1.12:1);}
function playRadiusScene(){
 if(radiusLab.playing){setLabRadius(radiusLab.radius);return;}
 radiusLab.playing=true;const start=performance.now(),end=Math.cbrt(.5);
 function frame(now){if(!radiusLab.playing||!$('radiusComparison'))return;const p=Math.min(1,(now-start)/2400),ease=p*p*(3-2*p);radiusLab.radius=1+(end-1)*ease;updateRadiusLab();if(p<1)radiusLab.frame=requestAnimationFrame(frame);else{radiusLab.playing=false;updateRadiusLab();}}
 radiusLab.frame=requestAnimationFrame(frame);
}
function pressureColor(p){return p>1.01?'#ce7133':p<.99?'#378fa1':'#397fb6';}
function updateRadiusLab(){
 const r=radiusLab.radius,states=[radiusState(1,1),radiusState(r,1),radiusState(r,r**3)];
 $('radiusComparison').innerHTML=states.map((s,i)=>{
  const color=pressureColor(s.pressure),R=65*s.radius,dots=Math.max(1,Math.round(48*s.gas));let particles='';
  for(let j=0;j<dots;j++){const angle=j*2.39996,dist=(R-9)*Math.sqrt((j+.5)/dots);particles+=`<circle cx="${150+Math.cos(angle)*dist}" cy="${91+Math.sin(angle)*dist}" r="2.5" fill="${color}" opacity=".8"/>`;}
  const pressureLabel=i===0?'기준':s.pressure>1.01?'압력 높음':s.pressure<.99?'압력 낮음':'압력 같음';
  return `<article class="radius-case ${i===1?'fixed-gas':i===2?'scaled-gas':'reference-gas'}" data-radius-case="${i}" style="--case-color:${color}"><h3>${['기준 셀','가스량 그대로',s.gas<.99?'가스량도 줄임':s.gas>1.01?'가스량도 늘림':'가스량도 같음'][i]}</h3>
  <svg viewBox="60 0 180 180" role="img" aria-label="반지름 ${(s.radius*100).toFixed(1)}퍼센트, 가스량 ${(s.gas*100).toFixed(1)}퍼센트, 압력 ${s.pressure.toFixed(2)}배">
  <circle cx="150" cy="91" r="65" fill="none" stroke="#c9d7e4" stroke-dasharray="3 4"/><circle cx="150" cy="91" r="${R}" fill="${i===1?'#fff5ed':'#eef6fc'}" stroke="${color}" stroke-width="2"/>${particles}
  <path d="M150 91H${150+R}" stroke="${color}" stroke-width="1.6"/><circle cx="150" cy="91" r="2" fill="${color}"/></svg>
  <div class="radius-percent">반지름 <b>${+(s.radius*100).toFixed(1)}%</b><span class="cell-volume">체적 <b>${+(s.volume*100).toFixed(1)}%</b></span></div>
  <div class="gas-amount">가스량 <b>${(s.gas*100).toFixed(0)}%</b><span class="gas-meter"><i style="width:${s.gas/Math.max(...states.map(v=>v.gas))*100}%"></i></span></div>
  <div class="pressure-readout"><span>${pressureLabel}</span><strong>${s.pressure.toFixed(2)}<small>배</small></strong></div>
  <div class="pressure-meter"><i style="width:${s.pressure/Math.max(...states.map(v=>v.pressure))*100}%"></i></div></article>`;
 }).join('');
 $('radiusInput').value=r*100;$('radiusOutput').textContent=Math.round(r*100)+'%';$('radiusPlay').textContent=radiusLab.playing?'Ⅱ 멈춤':'▶ 변화 보기';
 document.querySelectorAll('.radius-presets button').forEach((button,i)=>button.classList.toggle('active',i===0&&Math.abs(r-Math.cbrt(.5))<.0001||i===1&&r===1||i===2&&r===1.12));
}

function updateBubbleRatios(){if(bubbleState.mode==='process')updateFoamingProcess();}

function toggleBubblePlay() {
  if(bubbleState.playing){stopBubbleMotion();$('bubblePlay').textContent='▶ 재생';return;}
  if(bubbleState.progress>=1)bubbleState.progress=0;
  bubbleState.playing=true;bubbleState.last=0;$('bubblePlay').textContent='Ⅱ 일시정지';
  function frame(time){
    if(!bubbleState.playing||!$('bubbleProgress'))return;
    if(bubbleState.last)bubbleState.progress=Math.min(1,bubbleState.progress+Math.min(time-bubbleState.last,60)/16000);
    bubbleState.last=time;updateBubbleRatios();
    if(bubbleState.progress<1)bubbleState.frame=requestAnimationFrame(frame);
    else{bubbleState.playing=false;$('bubblePlay').textContent='↻ 다시 재생';}
  }
  bubbleState.frame=requestAnimationFrame(frame);
}

function seekBubble(value){stopBubbleMotion();bubbleState.progress=Number(value)/100;updateBubbleRatios();$('bubblePlay').textContent='▶ 재생';}
function resetBubbleDemo(){seekBubble(0);}

function changeBubbleAxis(value){bubbleState.axis=+value;const lv=levels[bubbleState.axis];bubbleState.from=lv[0];bubbleState.to=lv[2];drawBubbleComparison();}
function bubbleRow(level){return data.find(row=>row.slice(0,4).every((v,i)=>v===(i===bubbleState.axis?level:bubbleState.fixed[i])));}

function drawBubbleComparison(){
 const a=bubbleState.axis;
 $('bubbleDetail').innerHTML=easyHeading('실제 해석에서는 크기와 압력이 어떻게 달랐을까?','원 크기는 버블 반지름, 아래 막대는 내부 압력을 비교합니다.')+
 `<div class="easy-case-controls"><label>조건 A <select id="bubbleFrom" onchange="bubbleState.from=+this.value;drawBubbleCases()">${levels[a].map(v=>`<option ${v===bubbleState.from?'selected':''}>${v}</option>`).join('')}</select></label><span>와</span><label>조건 B <select id="bubbleTo" onchange="bubbleState.to=+this.value;drawBubbleCases()">${levels[a].map(v=>`<option ${v===bubbleState.to?'selected':''}>${v}</option>`).join('')}</select></label><span>${names[a]} (${units[a]}) 비교</span></div>
 <div class="bubble-pair" id="bubbleCases"></div><div class="easy-answer" id="actualConclusion"></div><p id="actualContext" class="easy-note"></p>
 <details class="easy-details"><summary>비교 조건·압력 종류 바꾸기</summary><div class="bubble-compare-controls"><label>비교 변수 <select id="bubbleAxis" onchange="changeBubbleAxis(this.value)">${[1,0,2,3].map(i=>`<option value="${i}" ${a===i?'selected':''}>${names[i]}</option>`).join('')}</select></label><label>압력 종류 <select id="bubblePressureType" onchange="bubbleState.pressure=+this.value;drawBubbleCases()"><option value="6" ${bubbleState.pressure===6?'selected':''}>최대</option><option value="7" ${bubbleState.pressure===7?'selected':''}>평균</option></select></label></div><div class="bubble-fixed">${names.map((n,i)=>i===a?'':`<label>${n}<select aria-label="비교 고정 ${n}" onchange="bubbleState.fixed[${i}]=+this.value;drawBubbleCases()">${levels[i].map(v=>`<option ${v===bubbleState.fixed[i]?'selected':''}>${v}</option>`).join('')}</select></label>`).join('')}</div><p>81조건의 해석값을 조회합니다. 반지름은 최대값이며, 두 원에 같은 축척을 적용합니다. 실제 셀의 사진이 아닙니다. 반지름과 압력이 같은 위치·시점의 값인지는 확인되지 않았습니다.</p></details>`;
 drawBubbleCases();
}

function drawBubbleCases() {
  const rows=[bubbleRow(bubbleState.from),bubbleRow(bubbleState.to)];
  if(rows.some(r=>!r)){$('bubbleCases').textContent='선택한 조건의 데이터가 없습니다.';return;}
  const maxR=Math.max(...rows.map(r=>r[5])),p=bubbleState.pressure,maxP=Math.max(...rows.map(r=>r[p]));
  $('bubbleCases').innerHTML=rows.map((r,i)=>{
    const radius=65*r[5]/maxR;
    return `<section class="bubble-case"><h3>${i?'B':'A'} · ${r[bubbleState.axis]} ${units[bubbleState.axis]}<small>해석값</small></h3>
    <svg viewBox="0 0 240 175" role="img" aria-label="${i?'B':'A'} 조건 버블 반지름 ${fmt(r[5])} mm. 압력 ${fmt(r[p])} MPa">
    <path d="M25 87H215M120 15V159" stroke="#e4ebf2" stroke-dasharray="3 4"/>
    <circle cx="120" cy="87" r="65" fill="none" stroke="#dce6ef" stroke-dasharray="3 4"/>
    <circle cx="120" cy="87" r="${radius}" fill="${i?'#c5dff1':'#e1ebf4'}" stroke="${i?'#397fb6':'#7a9bb6'}" stroke-width="1.5"/>
    <path d="M120 87h${radius}" stroke="#365e81"/><circle cx="120" cy="87" r="2" fill="#365e81"/>
    <text x="120" y="170" text-anchor="middle" font-size="10" fill="#607286">반지름 크기 비교</text></svg>
    <dl><div><dt>반지름</dt><dd>${fmt(r[5])} <small>mm</small></dd></div><div><dt>압력 ${p===6?'최대':'평균'}</dt><dd class="case-pressure">${fmt(r[p])} <small>MPa</small></dd></div></dl><div class="actual-pressure-track" aria-label="같은 축척의 압력 막대"><div style="width:${r[p]/maxP*100}%"></div></div></section>`;
  }).join('');
  const size=rows[1][5]>rows[0][5]?'커졌고':rows[1][5]<rows[0][5]?'작아졌고':'같고';
  const pressure=rows[1][p]>rows[0][p]?'높아졌음':rows[1][p]<rows[0][p]?'낮아졌음':'같음';
  $('actualConclusion').textContent=`A와 비교하면 B의 반지름은 ${size}, 압력은 ${pressure}.`;
  $('actualContext').textContent=names.map((n,i)=>i===bubbleState.axis?'':n+' '+bubbleState.fixed[i]+' '+units[i]).filter(Boolean).join(' · ')+` · 압력 ${p===6?'최대':'평균'}값 비교`;
  $('actualContext').innerHTML+='<br><b>관찰한 차이입니다. 1·2번 모식도가 이 차이의 원인을 입증한 것은 아닙니다.</b>';
}
