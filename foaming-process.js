// Educational animation of the documented process, not a Moldflow solver.
// The displayed stages separate concepts; nucleation and growth can overlap.
const foamingStages = [
  {name:'가스 용해',title:'가스가 수지에 녹아 있음',text:'CBA에서 발생한 가스가 높은 압력의 용융 수지에 녹아 있습니다.',pressure:'높은 압력',cell:'아직 뚜렷한 기포 없음',takeaway:'CBA는 가스를 만드는 재료입니다.'},
  {name:'핵생성',title:'작은 기포가 처음 생김',text:'주변 수지 압력이 낮아지면 과포화된 가스가 작은 기포를 만듭니다.',pressure:'압력 감소',cell:'새로운 기포 생성',takeaway:'기포핵은 막 생긴 작은 버블입니다.'},
  {name:'기포 성장',title:'생긴 기포가 커짐',text:'수지에 녹아 있던 가스가 기포 안으로 확산하며 기포가 성장합니다.',pressure:'안팎 압력 차와 수지 저항',cell:'반지름 증가',takeaway:'기포가 생기는 것과 커지는 것은 다른 과정입니다.'},
  {name:'고화',title:'냉각되며 셀 구조가 고정됨',text:'수지가 냉각되어 굳으면 기포 성장이 멈추고 내부 셀 구조가 남습니다.',pressure:'냉각되어 굳음',cell:'셀 구조 고정',takeaway:'최종 셀 수와 크기는 이 과정을 거친 결과입니다.'}
];
function foamingFrame(progress){
  const p=Math.max(0,Math.min(1,progress)),stage=Math.min(3,Math.floor(p*4));
  return {stage,local:Math.min(1,p*4-stage),progress:p};
}
function drawFoamingProcess(){
  $('bubbleDetail').classList.add('foaming-process');
  $('bubbleDetail').innerHTML=`<div class="process-title"><h2>Moldflow 미세다공 포밍 공정</h2><span>공정 설명 모식도</span></div>
    <div class="cba-origin"><b>PP + CBA</b><span class="process-link">가열</span><strong>CBA 반응으로 가스 발생</strong><span>수지와 함께 금형으로</span></div>
    <nav class="process-steps" aria-label="포밍 공정 단계">${foamingStages.map((s,i)=>`<button onclick="selectFoamingStage(${i})" data-process-stage="${i}" aria-pressed="false"><b>0${i+1}</b><span>${s.name}</span></button>`).join('')}</nav>
    <div class="process-scene"><div class="process-illustration"><svg id="processVisual" viewBox="0 0 620 265" role="img"></svg><p class="process-legend"><i></i> 파란 점: 가스 표시 <span>둥근 경계: 기포</span></p></div>
    <aside class="process-explanation"><span id="processStepNumber"></span><h3 id="processTitle"></h3><p id="processText"></p><dl><div><dt>주변 수지</dt><dd id="processPressure"></dd></div><div><dt>기포 상태</dt><dd id="processCell"></dd></div></dl></aside></div>
    <div class="process-takeaway" id="processTakeaway" aria-live="polite"></div>
    <div class="bubble-playback"><button id="bubblePlay" onclick="toggleBubblePlay()">▶ 전체 과정 재생</button><label><input id="bubbleProgress" type="range" min="0" max="100" value="0" aria-label="포밍 공정 진행률" oninput="seekBubble(this.value)"></label><output id="bubbleProgressValue">0%</output></div>
    <details class="easy-details"><summary>시뮬레이션에서는 어떻게 계산할까? · 공식 근거</summary>
      <div class="process-models"><div><b>CBA 함량·가스 전환율</b><p>발생 가스량을 설정합니다. CBA 입자 하나를 셀 하나로 바꾸는 계산이 아닙니다.</p></div><div><b>선택한 핵생성 모델</b><p>고정 수밀도 모델은 단위 체적당 셀 수를 입력합니다. 적합 고전 핵생성 모델은 핵생성률을 계산합니다. 현재 연구에서 선택한 모델은 설정 확인이 필요합니다.</p></div><div><b>기포 성장·냉각</b><p>가스 확산과 수지 상태에 따른 성장, 냉각 후 구조를 연결해 이해합니다. 이 애니메이션은 해석기를 실행한 결과가 아닙니다.</p></div></div>
      <p>적합 고전 핵생성 모델의 공식 설명에는 온도, 표면장력, 핵생성 전 가스 압력과 수지 압력, 적합 계수가 제시됩니다. ‘점도·체적·온도만으로 핵 개수를 정한다’는 뜻은 아닙니다. 단계는 설명을 위해 나누었으며 실제 핵생성과 성장은 겹칠 수 있습니다.</p>
      <p>CBA 설명 문서는 배럴에서 가스 발생 반응이 완료된 것으로 가정하며, 반응 속도식을 직접 풀지 않는다고 명시합니다. 그림의 가스 점, 셀 개수·크기·시간은 설명용입니다. 주변 수지 압력과 버블 내부 압력을 구분합니다.</p>
      <div class="process-sources"><a href="https://help.autodesk.com/view/MFC/2023/KOR/?guid=MoldflowComm_CLC_Analyses_molding_processes_microcellular_inj_molding_Microcellular_foaming_process_html" target="_blank" rel="noopener noreferrer">공정 설명 · 2023</a><a href="https://help.autodesk.com/cloudhelp/2021/ENU/MoldflowInsight-CLC-Analyses/files/molding-processes/microcellular-inj-molding/MoldflowInsight_CLC_Analyses_molding_processes_microcellular_inj_molding_Microcellular_Injection_Molding_2_html.html" target="_blank" rel="noopener noreferrer">CBA 가정 · 2021</a><a href="https://help.autodesk.com/cloudhelp/2021/ENU/MoldflowInsight-CLC-Analyses/files/molding-processes/microcellular-inj-molding/MoldflowInsight_CLC_Analyses_molding_processes_microcellular_inj_molding_Process_Settings_Wizard_dialog_2_html.html" target="_blank" rel="noopener noreferrer">핵생성 모델 선택 · 2021</a><a href="https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/sim-math-models/MoldflowInsight_CLC_Ref_Materials_sim_math_models_Fitted_Classical_Nucleation_html.html" target="_blank" rel="noopener noreferrer">핵생성률 · 2023</a></div>
    </details>`;
  updateFoamingProcess();
}
function selectFoamingStage(stage){
  stopBubbleMotion();
  // Show the completed illustration of the selected stage; playing continues from it.
  bubbleState.progress=[.12,.49,.74,1][stage];
  updateFoamingProcess();$('bubblePlay').textContent='▶ 여기서 재생';
}
function updateFoamingProcess(){
  const {stage,local,progress}=foamingFrame(bubbleState.progress),s=foamingStages[stage];
  const centers=[[145,101],[306,107],[474,102],[159,190],[322,185],[477,185]];
  const born=i=>Math.max(0,Math.min(1,((progress-.27)*4.4-i*.06)*2.3));
  const grow=Math.max(0,Math.min(1,(progress-.5)/.25));
  const cool=stage===3?local:0;
  let svg=`<defs><linearGradient id="meltFill" x2="0" y2="1"><stop stop-color="${stage===3?'#c4d5e4':'#f5d6b6'}"/><stop offset="1" stop-color="${stage===3?'#e0eaf2':'#ffedda'}"/></linearGradient></defs>
    <text x="30" y="23" font-size="14" fill="#526d85">${stage===0?'배럴 속 용융 수지 · 확대':stage===3?'냉각된 시편 내부 · 확대':'금형 속 용융 수지 · 확대'}</text>
    <rect x="25" y="38" width="570" height="206" rx="17" fill="url(#meltFill)" stroke="${stage===3?'#93abc1':'#d4ac83'}" stroke-width="2"/>
    <path d="M42 46H578M42 236H578" stroke="${stage===3?'#8da7be':'#ecd0ae'}" stroke-width="${8+cool*8}" stroke-linecap="round"/>`;
  centers.forEach(([cx,cy],i)=>{
    const b=born(i),r=(7+grow*(25+i%3*3))*b;
    if(b>0)svg+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f8fcff" fill-opacity="${b}" stroke="#397fad" stroke-opacity="${b}" stroke-width="2"/>`;
  });
  // Fixed count of gas markers; a subset stays dissolved. No empty pre-existing nuclei.
  for(let i=0;i<60;i++){
    const cell=Math.floor(i/10),j=i%10,[cx,cy]=centers[cell];
    const x0=49+(i%12)*46,y0=65+Math.floor(i/12)*36;
    const b=born(cell),r=7+grow*(25+cell%3*3),angle=j*2.39996;
    const moving=j<2?b:j<6?grow:0;
    const dist=(r-3)*Math.sqrt((j+.3)/6)*.72;
    const x=x0+(cx+Math.cos(angle)*dist-x0)*moving,y=y0+(cy+Math.sin(angle)*dist-y0)*moving;
    svg+=`<circle data-process-gas="${i}" cx="${x}" cy="${y}" r="2.8" fill="#236eab"/>`;
  }
  if(stage===1)svg+='<text x="580" y="23" text-anchor="end" fill="#a25723" font-size="14">주변 수지 압력 감소</text>';
  if(stage===2)svg+='<path d="M352 107h40m-8-6 8 6-8 6" fill="none" stroke="#236eab" stroke-width="2"/><text x="389" y="78" font-size="13" fill="#236eab">가스 확산</text>';
  if(stage===3)svg+='<text x="580" y="23" text-anchor="end" fill="#31628b" font-size="14">냉각 · 구조 고정</text>';
  $('processVisual').innerHTML=svg;
  $('processVisual').setAttribute('aria-label',s.title+'. '+s.text);
  $('processStepNumber').textContent=`STEP 0${stage+1} · ${s.name}`;
  $('processTitle').textContent=s.title;$('processText').textContent=s.text;
  $('processPressure').textContent=s.pressure;$('processCell').textContent=s.cell;
  if($('processTakeaway').textContent!==s.takeaway)$('processTakeaway').textContent=s.takeaway;
  document.querySelectorAll('[data-process-stage]').forEach((button,i)=>{
    button.classList.toggle('active',i===stage);button.setAttribute('aria-pressed',String(i===stage));
  });
  $('bubbleProgress').value=Math.round(progress*100);$('bubbleProgressValue').textContent=Math.round(progress*100)+'%';
}
