// Process illustrations and recorded Moldflow results are separate views.
const bubbleState = { mode: 'process', progress: 0, playing: false, frame: 0, last: 0,
  axis: 1, fixed: [1,205,150,90], pressure: 6 };

function stopBubbleMotion() {
  cancelAnimationFrame(bubbleState.frame);
  bubbleState.playing = false;
  bubbleState.last = 0;
}

function bubbleNavigation(mode) {
 return '<nav class="bubble-modes" aria-label="버블 비교 방식">'+[['process','포밍 공정'],['actual','해석값 비교'],['focus','온도·밀도']].map(([key,label])=>`<button data-bubble-mode="${key}" onclick="showBubble('${key}')" class="${mode===key?'active':''}" aria-pressed="${mode===key}">${label}</button>`).join('')+'</nav>';
}

function showBubble(mode=bubbleState.mode){
 if(!['process','actual','focus'].includes(mode))mode='process';
 setPage('bubble');document.body.classList.remove('heat','prediction','video-page');document.body.classList.add('bubble-page');
 document.querySelector('.controls').hidden=true;$('heatControls').hidden=true;bubbleState.mode=mode;bubbleState.progress=1;
 const steps=['process','actual','focus'],i=steps.indexOf(mode);
 $('charts').innerHTML=`<section class="easy-workbench"><div class="bubble-toolbar">${bubbleNavigation(mode)}</div><section id="bubbleDetail" class="easy-content"></section>
 <div class="easy-navigation"><button onclick="showBubble('${steps[Math.max(0,i-1)]}')" ${i===0?'disabled':''}>이전</button><span>${i+1} / 3 · ${i===0?'공식 공정 설명':'Moldflow 해석 데이터'}</span><button onclick="showBubble('${steps[Math.min(2,i+1)]}')" ${i===2?'disabled':''}>다음</button></div></section>`;
 if(mode==='process')drawFoamingProcess();else if(mode==='focus')drawDensityOverview();else drawBubbleComparison();
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

function updateBubbleRatios(){if(bubbleState.mode==='process')updateFoamingProcess();}

function toggleBubblePlay() {
  if(bubbleState.playing){stopBubbleMotion();$('bubblePlay').textContent='▶ 재생';return;}
  if(bubbleState.progress>=1)bubbleState.progress=0;
  bubbleState.playing=true;bubbleState.last=0;$('bubblePlay').textContent='Ⅱ 일시정지';
  function frame(time){
    if(!bubbleState.playing||!$('bubbleProgress'))return;
    if(bubbleState.last)bubbleState.progress=Math.min(1,bubbleState.progress+Math.min(time-bubbleState.last,60)/7000);
    bubbleState.last=time;updateBubbleRatios();
    if(bubbleState.progress<1)bubbleState.frame=requestAnimationFrame(frame);
    else{bubbleState.playing=false;$('bubblePlay').textContent='↻ 다시 재생';}
  }
  bubbleState.frame=requestAnimationFrame(frame);
}

function seekBubble(value){stopBubbleMotion();bubbleState.progress=Number(value)/100;updateBubbleRatios();$('bubblePlay').textContent='▶ 재생';}
function resetBubbleDemo(){seekBubble(0);}

function changeBubbleAxis(value){bubbleState.axis=+value;drawBubbleComparison(true);}
function bubbleRow(level){return data.find(row=>row.slice(0,4).every((v,i)=>v===(i===bubbleState.axis?level:bubbleState.fixed[i])));}
function bubbleCoreDensity(row){const match=focusRows.find(r=>r.slice(0,4).every((v,i)=>v===row[i]));return match?match[9]:null;}
function bubbleTrend(values){
 const up=values.every((v,i)=>i===0||v>values[i-1]),down=values.every((v,i)=>i===0||v<values[i-1]);
 return up?'증가':down?'감소':values.every(v=>v===values[0])?'같음':'일정한 방향 없음';
}
function drawBubbleComparison(expanded=false){
 const a=bubbleState.axis;
 $('bubbleDetail').classList.add('result-comparison');
 $('bubbleDetail').innerHTML=`<div class="results-heading"><div><h2>셀 수 밀도·크기 비교</h2><p id="actualContext"></p></div><label>버블 압력<select id="bubblePressureType" onchange="bubbleState.pressure=+this.value;drawBubbleCases()"><option value="6" ${bubbleState.pressure===6?'selected':''}>최대</option><option value="7" ${bubbleState.pressure===7?'selected':''}>평균</option></select></label></div>
 <div class="result-cases" id="bubbleCases"></div>
 <div class="result-trends" id="actualConclusion" aria-live="polite"></div>
 <p class="result-note">수밀도와 반지름은 최대값 · 원은 크기 비교용 · 수밀도만으로 최초 핵 개수를 확정하지 않음</p>
 <details class="easy-details" ${expanded?'open':''}><summary>다른 공정조건 비교 · 추출 기준</summary><div class="bubble-compare-controls"><label>비교 변수<select id="bubbleAxis" onchange="changeBubbleAxis(this.value)">${[1,0,2,3].map(i=>`<option value="${i}" ${a===i?'selected':''}>${names[i]}</option>`).join('')}</select></label></div><div class="bubble-fixed">${names.map((n,i)=>i===a?'':`<label>${n}<select aria-label="비교 고정 ${n}" onchange="bubbleState.fixed[${i}]=+this.value;drawBubbleCases()">${levels[i].map(v=>`<option ${v===bubbleState.fixed[i]?'selected':''}>${v}</option>`).join('')}</select></label>`).join('')}</div>
 <p>각 열은 하나의 해석 조건입니다. 81조건에서 나머지 세 변수를 고정한 세 수준을 비교합니다. 셀 수 밀도와 반지름은 최대값, 버블 압력은 선택한 최대/평균값입니다. 각각의 값이 동일 위치·시점에서 추출되었다고 확인한 결과는 아닙니다.</p><p>코어밀도는 수정된 온도3조건에서만 표시합니다. 나머지 조건에는 ‘자료 없음’을 표시하며 보간하지 않습니다. 코어밀도는 내부 폼의 밀도이며 기포 속 가스 밀도가 아닙니다.</p><p>반지름 원은 공통 길이 축척, 수밀도·압력 막대는 각각 0부터 공통 최댓값까지의 축척입니다. 화면에 보이는 원 개수는 실제 셀 수가 아닙니다. 포밍 공정 그림은 결과의 발생 과정을 이해하기 위한 모식도이며 관찰된 차이의 원인을 입증하지 않습니다. 최대값들로 총 셀 체적이나 셀당 가스량을 역산하지 않습니다.</p></details>`;
 drawBubbleCases();
}
function drawBubbleCases(){
 const a=bubbleState.axis,rows=levels[a].map(bubbleRow),p=bubbleState.pressure;
 if(rows.some(r=>!r)){$('bubbleCases').textContent='선택한 조건의 데이터가 없습니다.';return;}
 const maxR=Math.max(...rows.map(r=>r[5])),maxN=Math.max(...rows.map(r=>r[8])),maxP=Math.max(...rows.map(r=>r[p]));
 $('bubbleCases').innerHTML=rows.map((r,i)=>{
  const radius=34*r[5]/maxR,core=bubbleCoreDensity(r);
  return `<article class="result-case" data-result-condition="${r.slice(0,4).join('/')}"><h3>${r[a]} <small>${units[a]}</small></h3>
    <div class="result-number"><span>버블 수 밀도 <small>개/cm³</small></span><strong>${r[8].toLocaleString('en-US',{maximumFractionDigits:2})}</strong><div class="result-meter"><i style="width:${r[8]/maxN*100}%"></i></div></div>
    <div class="result-radius"><svg viewBox="0 0 200 85" role="img" aria-label="버블 반지름 ${r[5]} mm, 세 조건에 같은 축척"><circle cx="100" cy="40" r="34" fill="none" stroke="#bed1e0" stroke-dasharray="3 4"/><circle cx="100" cy="40" r="${radius}" fill="#79b9eb"/><path d="M100 40h${radius}" stroke="#214d6f"/><circle cx="100" cy="40" r="1.5" fill="#214d6f"/></svg><span>버블 반지름</span><strong>${fmt(r[5])}<small> mm</small></strong></div>
    <div class="result-pressure"><span>버블 압력 <small>${p===6?'최대':'평균'}</small></span><strong>${fmt(r[p])}<small> MPa</small></strong><div class="result-meter"><i style="width:${r[p]/maxP*100}%"></i></div></div>
    <div class="result-core"><span>코어밀도</span><strong>${core===null?'자료 없음':core.toFixed(4)}${core===null?'':'<small> g/cm³</small>'}</strong></div></article>`;
 }).join('');
 $('actualContext').textContent=names.filter((_,i)=>i!==a).map(n=>{const i=names.indexOf(n);return n+' '+bubbleState.fixed[i]+' '+units[i];}).join(' · ');
 const trends=[['수밀도',8],['반지름',5],['압력',p]];
 $('actualConclusion').innerHTML=`<span>${names[a]} ${levels[a].join(' · ')} ${units[a]}</span>`+trends.map(([name,col])=>`<b>${name} <em>${bubbleTrend(rows.map(r=>r[col]))}</em></b>`).join('');
}
