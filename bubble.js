// The ideal-gas demonstration uses relative states at fixed temperature.
// It is deliberately independent of the Moldflow results and trained models.
const bubbleState = { mode: 'volume', progress: 0, playing: false, frame: 0, last: 0,
  axis: 1, fixed: [1,205,150,90], from: 190, to: 220, pressure: 6 };

function bubbleRatios(mode, progress) {
  const volume = 1 - .5 * Math.max(0, Math.min(1, progress));
  const gas = mode === 'both' ? volume : 1;
  return { gas, volume, radius: Math.cbrt(volume), density: gas / volume, pressure: gas / volume };
}

function stopBubbleMotion() {
  cancelAnimationFrame(bubbleState.frame);
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

function showBubble(mode = bubbleState.mode) {
  setPage('bubble');
  document.body.classList.remove('heat', 'prediction', 'video-page');
  document.body.classList.add('bubble-page');
  document.querySelector('.controls').hidden = true;
  $('heatControls').hidden = true;
  bubbleState.mode = mode;
  bubbleState.progress = 0;
  $('charts').innerHTML = `<section class="bubble-workbench">
    <div class="bubble-toolbar"><nav class="bubble-modes" aria-label="버블 비교 방식">
      <button type="button" data-bubble-mode="volume" onclick="showBubble('volume')" class="${mode==='volume'?'active':''}" aria-pressed="${mode==='volume'}">① 같은 가스량 · 작은 공간</button>
      <button type="button" data-bubble-mode="both" onclick="showBubble('both')" class="${mode==='both'?'active':''}" aria-pressed="${mode==='both'}">② 가스량·체적 함께 감소</button>
      <button type="button" data-bubble-mode="actual" onclick="showBubble('actual')" class="${mode==='actual'?'active':''}" aria-pressed="${mode==='actual'}">③ 내 해석 결과</button>
    </nav><span class="bubble-tag">${mode==='actual'?'Moldflow 결과 비교':'원리 모식도 · 온도 일정'}</span></div>
    <div class="bubble-layout"><section class="specimen-panel"><div class="bubble-panel-head"><h2>시편 단면</h2><span>구조 모식도</span></div>${specimenDiagram()}<div class="specimen-foot"><span>매끈한 표면 · 내부 셀</span><b>확대 관찰</b></div></section>
    <section class="bubble-detail" id="bubbleDetail"></section></div>
    <div class="bubble-bottom"><span id="bubbleFootnote"></span><a href="https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/equation-of-state/" target="_blank" rel="noopener noreferrer">이상기체식 근거 ↗</a></div>
  </section>`;
  if(mode==='actual')drawBubbleComparison(); else drawBubblePrinciple();
}

function drawBubblePrinciple() {
  $('bubbleDetail').innerHTML = `<div class="bubble-detail-head"><h2>버블 확대</h2><small>처음 상태를 1로 비교 · 온도 일정</small></div>
  <svg class="bubble-visual" viewBox="0 0 620 280" role="img" aria-label="기준 버블과 비교 버블의 가스량, 체적, 압력 변화">
    <defs><radialGradient id="bubbleFill"><stop stop-color="#fff"/><stop offset=".8" stop-color="#e6f2fb"/><stop offset="1" stop-color="#bcd8ec"/></radialGradient></defs>
    <text x="162" y="24" text-anchor="middle" fill="#607286" font-size="13">처음 상태</text><text x="458" y="24" text-anchor="middle" fill="#2462a8" font-size="13">비교 상태</text>
    <path d="M300 134 H320 M314 128 L320 134 L314 140" fill="none" stroke="#b7c8d7" stroke-width="2"/>
    <circle cx="162" cy="139" r="82" fill="url(#bubbleFill)" stroke="#aac6db" stroke-width="2"/>
    <circle cx="458" cy="139" r="82" fill="none" stroke="#d4e0eb" stroke-dasharray="4 5"/>
    <circle id="bubbleCurrentCircle" cx="458" cy="139" r="82" fill="url(#bubbleFill)" stroke="#397fb6" stroke-width="2"/>
    <g id="bubbleReferenceParticles"></g><g id="bubbleCurrentParticles"></g>
    <path d="M162 139 H244" stroke="#647e94" stroke-width="1.5"/><text x="201" y="131" text-anchor="middle" font-size="11" fill="#486279">R₀</text>
    <path id="bubbleRadiusLine" d="M458 139 H540" stroke="#2462a8" stroke-width="1.5"/><text id="bubbleRadiusLabel" x="499" y="131" text-anchor="middle" font-size="11" fill="#2462a8">R = 1.00 R₀</text>
    <text x="162" y="255" text-anchor="middle" fill="#607286" font-size="14">압력 1.00배</text><text id="bubblePressureLabel" x="458" y="255" text-anchor="middle" fill="#2462a8" font-size="17" font-weight="700">압력 1.00배</text>
  </svg>
  <div class="bubble-equation"><span>P = nRT / V</span><small>온도 일정</small><strong>P / P₀ = (n / n₀) ÷ (V / V₀)</strong></div>
  <div class="bubble-metrics">
    <div class="bubble-metric"><span>가스량 n</span><strong id="bubbleGas">1.00</strong><small>처음 대비 배수</small></div>
    <div class="bubble-metric"><span>셀 체적 V</span><strong id="bubbleVolume">1.00</strong><small>처음 대비 배수</small></div>
    <div class="bubble-metric"><span>가스 밀도 n/V</span><strong id="bubbleDensity">1.00</strong><small>처음 대비 배수</small></div>
    <div class="bubble-metric pressure"><span>내부 압력 P</span><strong id="bubblePressure">1.00</strong><small>처음 대비 배수</small></div>
  </div>
  <div class="bubble-playback"><button id="bubblePlay" type="button" onclick="toggleBubblePlay()">▶ 재생</button><button type="button" class="bubble-reset" onclick="resetBubbleDemo()" aria-label="버블 비교 처음으로">↺</button><label><input id="bubbleProgress" type="range" min="0" max="100" step="1" value="0" aria-label="버블 상태 비교 진행률" oninput="seekBubble(this.value)"></label><output id="bubbleProgressValue">0%</output></div>
  <p class="bubble-conclusion" id="bubbleConclusion" aria-live="polite">${bubbleState.mode==='volume'?'같은 가스량이 더 작은 공간에 들어가면?':'가스량과 공간을 같은 비율로 줄이면?'}</p>`;
  $('bubbleFootnote').textContent = '등온 이상기체의 상태 비교 · 점은 설명용 가스 표시 · 실제 셀의 성장 과정이나 관측 영상이 아님';
  createBubbleParticles();
  updateBubbleRatios();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)toggleBubblePlay();
}

function createBubbleParticles() {
  ['bubbleReferenceParticles','bubbleCurrentParticles'].forEach(id=>{
    $(id).innerHTML=Array.from({length:40},(_,i)=>`<circle data-particle="${i}" r="2.6" fill="#4187b9" opacity=".8"/>`).join('');
  });
}

function positionBubbleParticles(time = 0) {
  const ratios=bubbleRatios(bubbleState.mode,bubbleState.progress), radius=82*ratios.radius;
  // A 3D shell projection. Particle count is an illustrative amount, never a measured count.
  ['bubbleReferenceParticles','bubbleCurrentParticles'].forEach((id,group)=>{
    const host=$(id);if(!host)return;
    host.querySelectorAll('circle').forEach((p,i)=>{
      const shell=.25+.65*((i*17%41)/40), angle=i*2.39996+time*.34*(i%2?1:-1), vertical=Math.sin(i*1.7+time*.43);
      const r=(group?radius:82)-6,cx=group?458:162;
      p.setAttribute('cx',cx+Math.cos(angle)*shell*r);
      p.setAttribute('cy',139+Math.sin(angle)*shell*r*Math.sqrt(1-.3*vertical*vertical));
      const visible=group?Math.max(0,Math.min(1,40*ratios.gas-i)):1;
      p.setAttribute('opacity',visible*(.55+.3*(vertical+1)/2));
    });
  });
}

function updateBubbleRatios() {
  const r=bubbleRatios(bubbleState.mode,bubbleState.progress), radius=82*r.radius;
  [['bubbleGas',r.gas],['bubbleVolume',r.volume],['bubbleDensity',r.density],['bubblePressure',r.pressure]].forEach(([id,v])=>$(id).textContent=v.toFixed(2));
  $('bubbleCurrentCircle').setAttribute('r',radius);
  $('bubbleRadiusLine').setAttribute('d',`M458 139 H${458+radius}`);
  $('bubbleRadiusLabel').setAttribute('x',458+radius/2);
  $('bubbleRadiusLabel').textContent=`R = ${r.radius.toFixed(2)} R₀`;
  $('bubblePressureLabel').textContent=`압력 ${r.pressure.toFixed(2)}배`;
  $('bubbleProgress').value=Math.round(bubbleState.progress*100);
  $('bubbleProgressValue').textContent=Math.round(bubbleState.progress*100)+'%';
  positionBubbleParticles(bubbleState.last/1000);
  if(bubbleState.progress>=1)$('bubbleConclusion').textContent=bubbleState.mode==='volume'?'가스량 그대로 · 체적 ½ → 가스 밀도 2배 · 압력 2배':'가스량 ½ · 체적 ½ → 가스 밀도 동일 · 압력 동일';
  else $('bubbleConclusion').textContent=bubbleState.mode==='volume'?'가스량은 그대로, 공간이 줄면서 압력이 높아짐':'가스량과 공간이 함께 줄어 압력은 그대로';
}

function toggleBubblePlay() {
  if(bubbleState.playing){stopBubbleMotion();$('bubblePlay').textContent='▶ 재생';return;}
  if(bubbleState.progress>=1)bubbleState.progress=0;
  bubbleState.playing=true;bubbleState.last=0;$('bubblePlay').textContent='Ⅱ 일시정지';
  function frame(time){
    if(!bubbleState.playing||!$('bubbleProgress'))return;
    if(bubbleState.last)bubbleState.progress=Math.min(1,bubbleState.progress+Math.min(time-bubbleState.last,60)/5500);
    bubbleState.last=time;updateBubbleRatios();
    if(bubbleState.progress<1)bubbleState.frame=requestAnimationFrame(frame);
    else{bubbleState.playing=false;$('bubblePlay').textContent='↻ 다시 재생';}
  }
  bubbleState.frame=requestAnimationFrame(frame);
}

function seekBubble(value){stopBubbleMotion();bubbleState.progress=Number(value)/100;updateBubbleRatios();$('bubblePlay').textContent='▶ 재생';}
function resetBubbleDemo(){seekBubble(0);}

function changeBubbleAxis(value){bubbleState.axis=+value;const lv=levels[bubbleState.axis];bubbleState.from=lv[0];bubbleState.to=lv[2];drawBubbleComparison();}
function bubbleRow(level){return focusRows.find(row=>row.slice(0,4).every((v,i)=>v===(i===bubbleState.axis?level:bubbleState.fixed[i])));}

function drawBubbleComparison() {
  bubbleState.axis=1;bubbleState.fixed=[1,205,150,90];const a=1;
  $('bubbleDetail').innerHTML=`<div class="bubble-detail-head"><h2>두 조건의 해석값 비교</h2><small>반지름: 최대값</small></div>
  <div class="bubble-compare-controls"><label>변수<select id="bubbleAxis" onchange="changeBubbleAxis(this.value)">${[1].map(i=>`<option value="${i}" ${a===i?'selected':''}>${names[i]}</option>`).join('')}</select></label>
  <label>A<select id="bubbleFrom" onchange="bubbleState.from=+this.value;drawBubbleCases()">${levels[a].map(v=>`<option ${v===bubbleState.from?'selected':''}>${v}</option>`).join('')}</select></label>
  <label>B<select id="bubbleTo" onchange="bubbleState.to=+this.value;drawBubbleCases()">${levels[a].map(v=>`<option ${v===bubbleState.to?'selected':''}>${v}</option>`).join('')}</select></label>
  <label>버블 압력<select id="bubblePressureType" onchange="bubbleState.pressure=+this.value;drawBubbleCases()"><option value="6" ${bubbleState.pressure===6?'selected':''}>최대</option><option value="7" ${bubbleState.pressure===7?'selected':''}>평균</option></select></label></div>
  <div class="focus-fixed">CBA 1% · 속도 150 mm/s · V/P 90%</div>
  <div class="bubble-pair" id="bubbleCases"></div><p class="bubble-actual-note"><b>원의 크기: 두 반지름에 같은 축척 적용.</b> 셀당 가스량은 표시하지 않음.<br>반지름·압력이 동일 위치·시점의 값인지 확인되지 않음.</p>`;
  $('bubbleFootnote').textContent='검토 대상 온도 3조건 중 선택한 2조건 · 실제 셀 구조 복원이나 압력 차이의 원인 확정이 아님';
  drawBubbleCases();
}

function drawBubbleCases() {
  const rows=[bubbleRow(bubbleState.from),bubbleRow(bubbleState.to)];
  if(rows.some(r=>!r)){$('bubbleCases').textContent='선택한 조건의 데이터가 없습니다.';return;}
  const maxR=Math.max(...rows.map(r=>r[5])),p=bubbleState.pressure;
  $('bubbleCases').innerHTML=rows.map((r,i)=>{
    const radius=65*r[5]/maxR;
    return `<section class="bubble-case"><h3>${i?'B':'A'} · ${r[bubbleState.axis]} ${units[bubbleState.axis]}<small>해석값</small></h3>
    <svg viewBox="0 0 240 175" role="img" aria-label="${i?'B':'A'} 조건 버블 반지름 ${fmt(r[5])} mm. 압력 ${fmt(r[p])} MPa">
    <path d="M25 87H215M120 15V159" stroke="#e4ebf2" stroke-dasharray="3 4"/>
    <circle cx="120" cy="87" r="65" fill="none" stroke="#dce6ef" stroke-dasharray="3 4"/>
    <circle cx="120" cy="87" r="${radius}" fill="${i?'#c5dff1':'#e1ebf4'}" stroke="${i?'#397fb6':'#7a9bb6'}" stroke-width="1.5"/>
    <path d="M120 87h${radius}" stroke="#365e81"/><circle cx="120" cy="87" r="2" fill="#365e81"/>
    <text x="120" y="170" text-anchor="middle" font-size="10" fill="#607286">가스량 미표시</text></svg>
    <dl><div><dt>반지름</dt><dd>${fmt(r[5])} <small>mm</small></dd></div><div><dt>압력 ${p===6?'최대':'평균'}</dt><dd class="case-pressure">${fmt(r[p])} <small>MPa</small></dd></div></dl></section>`;
  }).join('');
}
