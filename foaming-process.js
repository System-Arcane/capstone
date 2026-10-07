// A/B/C overview: the same illustrative nuclei grow into cells.
// This is not a solver or an extraction of actual Moldflow cell positions.
const foamingCenters=[[28,29],[104,40],[180,27],[247,42],[46,94],[132,97],[217,96],[26,158],[93,151],[168,162],[248,154]];
function foamingFrame(progress){
  const p=Math.max(0,Math.min(1,progress));
  return {progress:p,nucleation:Math.min(1,p/.4),growth:Math.max(0,(p-.4)/.6)};
}
function processCard(letter,title,subtitle){
  return `<div class="abc-card"><div class="abc-label"><b>${letter}</b><h3>${title}</h3></div><svg id="process${letter}" viewBox="0 0 280 200" role="img" aria-label="${title}: ${subtitle}"></svg><p>${subtitle}</p></div>`;
}
function drawFoamingProcess(){
  $('bubbleDetail').classList.add('foaming-process');
  $('bubbleDetail').innerHTML=`<div class="process-title"><h2>핵이 생성되고, 셀이 성장한다</h2><span>Moldflow 공정 모식도 · 고화 전</span></div>
    <div class="abc-sequence">${processCard('A','핵생성 전','균일한 혼합 수지')}<span class="abc-arrow" aria-hidden="true">➜</span>${processCard('B','핵생성','작은 기포핵이 생김')}<span class="abc-arrow" aria-hidden="true">➜</span>${processCard('C','셀 성장','생긴 기포가 커짐')}</div>
    <div class="abc-caption"><span><i class="resin-key"></i>파랑: 수지 영역</span><span><i class="cell-key"></i>흰 점·원: 기포핵과 성장한 셀</span></div>
    <div class="process-takeaway" id="processTakeaway" aria-live="polite">B의 작은 기포가 C의 큰 셀로 성장합니다.</div>
    <div class="bubble-playback"><button id="bubblePlay" onclick="toggleBubblePlay()">▶ 생성·성장 재생</button><label><input id="bubbleProgress" type="range" min="0" max="100" value="100" aria-label="핵생성·셀 성장 진행률" oninput="seekBubble(this.value)"></label><output id="bubbleProgressValue">100%</output></div>
    <details class="easy-details"><summary>셀이 많으면 왜 작아질 수 있을까? · 체적과 셀 합체</summary>
      <div class="abc-volume"><b>개별 셀의 평균 체적 = 전체 셀이 차지하는 체적 ÷ 셀 수</b><p>전체 셀 체적이 같다는 가정 아래, 셀 수가 2배면 평균 셀 체적은 절반입니다. 구형·동일 크기 셀로 단순화하면 반지름은 약 0.79배입니다.</p><p>시편 체적은 수지와 셀 공간을 모두 포함합니다. 시편 치수가 같아도 전체 셀 체적이 같다는 뜻은 아닙니다. 이 관계만으로 실제 성장 제한의 원인을 확정하지 않습니다.</p></div>
      <p>셀 사이 벽이 무너지며 연결되는 현상은 셀 합체(coalescence)입니다. 과도한 성장에서 나타날 수 있지만 CBA 과다 첨가와 같은 뜻은 아닙니다. 수지의 용융강도, 온도와 냉각도 영향을 줍니다. 제조사 권장 함량은 합체가 없다는 증거가 아닙니다.</p>
      <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7183088/" target="_blank" rel="noopener noreferrer">PP의 셀 안정화·합체 연구</a>
    </details>
    <details class="easy-details"><summary>핵생성·성장과 해석 모델 · 공식 근거</summary>
      <div class="process-models"><div><b>CBA 함량·가스 전환율</b><p>발생 가스량을 설정합니다. CBA 입자 하나를 셀 하나로 바꾸는 계산이 아닙니다.</p></div><div><b>선택한 핵생성 모델</b><p>고정 수밀도 모델은 단위 체적당 셀 수를 입력합니다. 적합 고전 핵생성 모델은 핵생성률을 계산합니다. 현재 연구에서 선택한 모델은 설정 확인이 필요합니다.</p></div><div><b>기포 성장·냉각</b><p>가스 확산과 수지 상태에 따른 성장, 냉각 후 구조를 연결해 이해합니다. 이 애니메이션은 해석기를 실행한 결과가 아닙니다.</p></div></div>
      <p>적합 고전 핵생성 모델의 공식 설명에는 온도, 표면장력, 핵생성 전 가스 압력과 수지 압력, 적합 계수가 제시됩니다. ‘점도·체적·온도만으로 핵 개수를 정한다’는 뜻은 아닙니다. 단계는 설명을 위해 나누었으며 실제 핵생성과 성장은 겹칠 수 있습니다.</p>
      <p>CBA 설명 문서는 배럴에서 가스 발생 반응이 완료된 것으로 가정하며, 반응 속도식을 직접 풀지 않는다고 명시합니다. 그림의 흰 점과 원은 기포이며, 크기·개수·시간은 설명용입니다. B와 C는 같은 기포를 이어 보여주며 합체·소멸을 생략했습니다. 주변 수지 압력과 버블 내부 압력을 구분합니다.</p>
      <div class="process-sources"><a href="https://help.autodesk.com/view/MFC/2023/KOR/?guid=MoldflowComm_CLC_Analyses_molding_processes_microcellular_inj_molding_Microcellular_foaming_process_html" target="_blank" rel="noopener noreferrer">공정 설명 · 2023</a><a href="https://help.autodesk.com/cloudhelp/2021/ENU/MoldflowInsight-CLC-Analyses/files/molding-processes/microcellular-inj-molding/MoldflowInsight_CLC_Analyses_molding_processes_microcellular_inj_molding_Microcellular_Injection_Molding_2_html.html" target="_blank" rel="noopener noreferrer">CBA 가정 · 2021</a><a href="https://help.autodesk.com/cloudhelp/2021/ENU/MoldflowInsight-CLC-Analyses/files/molding-processes/microcellular-inj-molding/MoldflowInsight_CLC_Analyses_molding_processes_microcellular_inj_molding_Process_Settings_Wizard_dialog_2_html.html" target="_blank" rel="noopener noreferrer">핵생성 모델 선택 · 2021</a><a href="https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/sim-math-models/MoldflowInsight_CLC_Ref_Materials_sim_math_models_Fitted_Classical_Nucleation_html.html" target="_blank" rel="noopener noreferrer">핵생성률 · 2023</a></div>
    </details>`;
  updateFoamingProcess();
}
function updateFoamingProcess(){
  const {progress,nucleation,growth}=foamingFrame(bubbleState.progress);
  const field='<rect x="0" y="0" width="280" height="200" rx="3" fill="#70b9f5"/>';
  $('processA').innerHTML=field;
  const birth=i=>Math.max(0,Math.min(1,nucleation*1.5-i*.045));
  $('processB').innerHTML=field+foamingCenters.map(([x,y],i)=>`<circle data-nucleus="${i}" cx="${x}" cy="${y}" r="${2*birth(i)}" fill="white"/>`).join('');
  $('processC').innerHTML=field+foamingCenters.map(([x,y],i)=>`<circle data-cell="${i}" cx="${x}" cy="${y}" r="${(2+growth*(12+i%3))*birth(i)}" fill="white"/>`).join('');
  const text=progress<.4?'B: 수지 안에 작은 기포핵이 생깁니다.':progress<1?'C: 생긴 기포핵이 점점 커집니다.':'B의 작은 기포가 C의 큰 셀로 성장합니다.';
  if($('processTakeaway').textContent!==text)$('processTakeaway').textContent=text;
  $('bubbleProgress').value=Math.round(progress*100);$('bubbleProgressValue').textContent=Math.round(progress*100)+'%';
}
