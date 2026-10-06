/* Presentation layer. The stored simulation data and fitted models are unchanged. */
const presentationOutputs = ['캐비티 중량', '버블 반지름', '버블 압력', '버블 수 밀도'];
const presentationUnits = ['g', 'mm', 'MPa', '개/cm³'];
const outputColumns = [4, 5, 7, 8];
let predictionView = 'try';
let heatPair = [1, 2];
let heatKind = 'results';
let heatGuideVisible = false;

function decorateGraph() {
  let context = $('graphContext');
  if (!context) {
    context = document.createElement('div');
    context.id = 'graphContext';
    document.querySelector('.controls').append(context);
  }
  const mode = $('mode').value;
  const descriptions = {
    fixed: ['3조건', '나머지 세 변수를 고정한 비교'],
    mean: ['81조건', '막대 하나 = 해당 수준의 27개 평균'],
    all: ['81조건', '선 하나 = 나머지 세 변수가 같은 3조건']
  };
  context.innerHTML = `<b>${descriptions[mode][0]}</b><span>${descriptions[mode][1]}</span>`;
  document.querySelector('body > details > summary').textContent = mode === 'mean'
    ? '평균 계산에 사용한 원자료 81개 보기' : `표시 데이터 ${mode === 'all' ? 81 : 3}개 보기`;
  $('filters').hidden = mode !== 'fixed';
  document.querySelectorAll('#tabs button').forEach((button, i) => {
    button.setAttribute('aria-pressed', String([1, 0, 2, 3][i] === axis));
  });
}

function correlationStrength(r) {
  const a = Math.abs(r);
  if (a >= 1 - 1e-12) return '완전한';
  return a < .2 ? '매우 약한' : a < .4 ? '약한' : a < .6 ? '보통의' : a < .8 ? '강한' : '매우 강한';
}

const originalDrawHeat = drawHeat;
drawHeat = function () {
  originalDrawHeat();
  const kind = $('corrType').value;
  if (heatKind !== kind) {
    heatKind = kind;
    heatPair = kind === 'results' ? [1, 2] : [3, 0];
  }
  const article = $('charts').querySelector('article');
  article.classList.add('interactive-heat');
  const matrixSvg = article.querySelector(':scope > svg');
  matrixSvg.setAttribute('role', 'group');
  matrixSvg.setAttribute('aria-label', '피어슨 상관 히트맵. 칸을 선택하면 관계를 자세히 볼 수 있습니다.');
  const rowLabels = kind === 'results' ? presentationOutputs : names;
  [...matrixSvg.querySelectorAll(':scope > g')].forEach((cell, index) => {
    const i = Math.floor(index / 4), j = index % 4;
    cell.classList.add('heat-cell');
    cell.dataset.row = i; cell.dataset.col = j;
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label', `${rowLabels[i]} / ${presentationOutputs[j]}, r ${correlations[kind][i][j].toFixed(3)}`);
    cell.onclick = () => { selectHeatPair(i, j); setHeatGuide(false); };
    cell.onkeydown = event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectHeatPair(i, j); setHeatGuide(false); }
    };
  });
  const aside = article.querySelector('.corr-guide');
  const guide = aside.innerHTML;
  aside.className = 'corr-explain';
  aside.innerHTML = `<div class="detail-tabs" aria-label="상관 해석 보기"><button id="pairTab" type="button" onclick="setHeatGuide(false)">선택한 관계</button><button id="guideTab" type="button" onclick="setHeatGuide(true)">강도 기준</button></div><div id="heatPairDetail"></div><div id="heatGuidePanel" hidden>${guide}</div>`;
  if (!$('heatHint')) {
    const hint = document.createElement('span'); hint.id = 'heatHint';
    hint.textContent = '칸을 눌러 관계 확인'; $('heatControls').append(hint);
  }
  selectHeatPair(...heatPair);
  setHeatGuide(heatGuideVisible);
};

function selectHeatPair(i, j) {
  heatPair = [i, j];
  const kind = $('corrType').value;
  const xColumn = kind === 'results' ? outputColumns[i] : i;
  const yColumn = outputColumns[j];
  const xLabel = kind === 'results' ? presentationOutputs[i] : names[i];
  const xUnit = kind === 'results' ? presentationUnits[i] : units[i];
  const yLabel = presentationOutputs[j], yUnit = presentationUnits[j];
  const r = correlations[kind][i][j], same = kind === 'results' && i === j;
  const direction = r > 0 ? '양의 상관' : r < 0 ? '음의 상관' : '직선 상관 없음';
  const phrase = same ? '같은 항목끼리 비교하므로 r = 1' : Math.abs(r) < .2
    ? '두 값의 직선 관계가 매우 약함' : r > 0 ? '한 값이 클수록 다른 값도 큰 경향' : '한 값이 클수록 다른 값은 작은 경향';
  $('heatPairDetail').innerHTML = `<div class="pair-heading"><span>${same ? '자기상관' : correlationStrength(r) + ' ' + direction}</span><strong style="color:${r < 0 ? '#3569a5' : '#b94444'}">${r > 0 ? '+' : ''}${r.toFixed(3)}<small>r</small></strong></div><h2>${xLabel}<span>×</span>${yLabel}</h2><p class="pair-takeaway">${phrase}</p>${pairScatter(data, xColumn, yColumn, xLabel, yLabel, xUnit, yUnit)}<p class="plot-caption">점 하나 = Moldflow 해석 1조건 · 총 81개</p><p class="pair-footnote">피어슨 · 버블 압력은 평균값<br>함께 변하는 경향을 보며, 원인으로 단정하지 않음</p>`;
  document.querySelectorAll('.heat-cell').forEach(cell => {
    const selected = +cell.dataset.row === i && +cell.dataset.col === j;
    cell.classList.toggle('selected', selected); cell.setAttribute('aria-pressed', String(selected));
  });
}

function pairScatter(rows, xColumn, yColumn, xLabel, yLabel, xUnit, yUnit) {
  const xs = rows.map(r => r[xColumn]), ys = rows.map(r => r[yColumn]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs), yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xp = v => 65 + (v - xMin) / (xMax - xMin || 1) * 245;
  const yp = v => 198 - (v - yMin) / (yMax - yMin || 1) * 147;
  let svg = `<text x="8" y="17" fill="#607286" font-size="11">${yLabel} (${yUnit})</text>`;
  for (let k = 0; k <= 2; k++) {
    const x = xMin + (xMax - xMin) * k / 2, y = yMin + (yMax - yMin) * k / 2;
    svg += `<line x1="65" x2="310" y1="${yp(y)}" y2="${yp(y)}" stroke="#e0e7ef"/><text x="58" y="${yp(y) + 4}" text-anchor="end" font-size="10" fill="#607286">${chartNumber(y)}</text><text x="${xp(x)}" y="218" text-anchor="middle" font-size="10" fill="#607286">${chartNumber(x)}</text>`;
  }
  svg += rows.map(row => `<circle cx="${xp(row[xColumn])}" cy="${yp(row[yColumn])}" r="3.5" fill="#3979b9" fill-opacity=".55"><title>${row.slice(0, 4).map((v, i) => names[i] + ' ' + v).join(' · ')} / ${xLabel} ${fmt(row[xColumn])} / ${yLabel} ${fmt(row[yColumn])}</title></circle>`).join('');
  svg += `<text x="187" y="244" text-anchor="middle" font-size="11" fill="#607286">${xLabel} (${xUnit})</text>`;
  return `<svg class="pair-scatter" viewBox="0 0 340 255" role="img" aria-label="${xLabel} / ${yLabel} 산점도, 81조건">${svg}</svg>`;
}

function setHeatGuide(visible) {
  heatGuideVisible = visible;
  $('heatPairDetail').hidden = visible; $('heatGuidePanel').hidden = !visible;
  $('pairTab').classList.toggle('active', !visible); $('guideTab').classList.toggle('active', visible);
  $('pairTab').setAttribute('aria-pressed', String(!visible)); $('guideTab').setAttribute('aria-pressed', String(visible));
}

function modelSketch(key) {
  const stroke = 'fill="none" stroke="#4b7faa" stroke-width="2.5"';
  let drawing, title, description;
  if (key === 'linear') {
    title = '선형회귀'; description = '네 변수의 영향을 가중합으로 계산';
    drawing = `<path d="M22 8V110H205" stroke="#bdcad9" fill="none"/><path d="M35 99L190 22" ${stroke}/>${[[45,89],[67,90],[90,66],[115,67],[133,48],[160,30],[181,34]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#d99b55"/>`).join('')}`;
  } else if (key === 'tree') {
    title = '결정트리'; description = '공정조건을 질문으로 나누어 예측';
    drawing = `<path d="M110 25V45H55V67 M110 45H170V67 M55 78V92H30V106 M55 92H80V106 M170 78V92H145V106 M170 92H195V106" ${stroke}/>${[[90,7,40,23],[35,62,40,21],[150,62,40,21],[15,101,30,16],[65,101,30,16],[130,101,30,16],[180,101,30,16]].map(p => `<rect x="${p[0]}" y="${p[1]}" width="${p[2]}" height="${p[3]}" rx="5" fill="#d9e8f5" stroke="#4b7faa"/>`).join('')}`;
  } else {
    title = '랜덤포레스트'; description = '여러 결정트리의 예측값을 평균';
    drawing = [35,110,185].map(x => `<path d="M${x} 20V38H${x-17}V53 M${x} 38H${x+17}V53" ${stroke}/><circle cx="${x}" cy="17" r="9" fill="#bfd5e9"/><circle cx="${x-17}" cy="58" r="8" fill="#6e9fc4"/><circle cx="${x+17}" cy="58" r="8" fill="#6e9fc4"/><path d="M${x} 74L110 96" stroke="#8baac3" fill="none"/>`).join('') + '<rect x="75" y="96" width="70" height="23" rx="6" fill="#245d8b"/><text x="110" y="112" text-anchor="middle" fill="white" font-size="12">평균</text>';
  }
  return `<svg viewBox="0 0 225 130" role="img" aria-label="${title} 개념도">${drawing}</svg><div><strong>${title}</strong><span>${description}</span></div>`;
}

function decoratePrediction() {
  const output = document.querySelector('.proto-output');
  output.insertAdjacentHTML('afterbegin', '<nav class="prediction-tabs" aria-label="예측 모델 보기"><button id="predictionTryTab" onclick="setPredictionView(\'try\')">예측해 보기</button><button id="predictionEvalTab" onclick="setPredictionView(\'evaluation\')">성능 확인</button></nav><section id="predictionTry"><div class="prediction-intro"><span class="section-kicker">공정조건 4개 입력</span><h2>이 조건의 해석값은?</h2><p>조건을 바꾸면 아래 네 예측값이 함께 바뀝니다.</p></div><div id="modelSketch" class="model-sketch"></div></section><section id="predictionEvaluation" hidden><div class="evaluation-intro"><h2>처음 보는 25조건에서 얼마나 맞았나?</h2><p>점선에 가까울수록 Moldflow 해석값과 가까운 예측입니다.</p><div class="sample-split" role="img" aria-label="총 81조건을 학습 56조건과 평가 25조건으로 분리"><span>학습 56</span><span>평가 25</span></div></div></section>');
  $('predictionTry').append($('predCards'));
  $('predictionTry').insertAdjacentHTML('beforeend', '<div id="predictionReference"></div><p class="prediction-scope">현재 PP·CBA와 해석 범위 안의 추정값</p><div id="treeTargetControl" hidden><label>분기 구조 확인<select id="treeTarget" onchange="selectTreeTarget(this.value)"><option value="0">캐비티 중량</option><option value="1">버블 반지름</option><option value="2">버블 압력 (평균)</option><option value="3">버블 수 밀도</option></select></label></div>');
  for (const selector of ['.validation-head', '.validation-layout', '#validationScores', '#modelComparison']) $('predictionEvaluation').append(output.querySelector(selector));
  $('predictionTry').append($('treeInspector'));
  document.querySelector('.validation-head h2').textContent = '비교할 항목';
  $('validationMetric').setAttribute('aria-label', '모델 평가 항목');
  document.querySelector('.proto-input > h1').textContent = '공정조건 입력';
  document.querySelector('.proto-input').insertAdjacentHTML('beforeend', '<div id="evaluationHelp" hidden><strong>평가 데이터는 고정</strong><p>모델과 비교 항목을 바꾸며 성능을 확인합니다.</p><p>실물 측정값이 아닌 Moldflow 해석값과 비교합니다.</p></div>');
  predictionView = 'try';
  updatePredictionOverview();
  setPredictionView('try');
}

function selectTreeTarget(value) { $('validationMetric').value = value; drawTreeInspector(); }

function setPredictionView(view) {
  predictionView = view;
  const evaluation = view === 'evaluation';
  $('predictionTry').hidden = evaluation; $('predictionEvaluation').hidden = !evaluation;
  $('evaluationHelp').hidden = !evaluation;
  document.querySelectorAll('.proto-input .slider-label').forEach(label => label.hidden = evaluation);
  document.querySelector('.proto-input > h1').textContent = evaluation ? '모델 선택' : '공정조건 입력';
  $('protoWarning').hidden = evaluation;
  for (const [id, active] of [['predictionTryTab', !evaluation], ['predictionEvalTab', evaluation]]) {
    $(id).classList.toggle('active', active); $(id).setAttribute('aria-pressed', String(active));
  }
  if (evaluation) drawValidation();
  $('charts').scrollTop = 0;
}

function updatePredictionOverview() {
  if (!$('predictionTry')) return;
  const key = $('modelSelect').value;
  $('modelSketch').innerHTML = modelSketch(key);
  $('treeTargetControl').hidden = key !== 'tree';
  if ($('treeTarget')) $('treeTarget').value = $('validationMetric').value;
  const vals = [0, 1, 2, 3].map(i => +$('px' + i).value);
  const row = data.find(r => vals.every((v, i) => Math.abs(v - r[i]) < 1e-9));
  $('predictionReference').innerHTML = row
    ? `<span>같은 조건의 저장 해석값</span><div>${outputColumns.map((column, i) => `<p><b>${fmt(row[column])}</b><small>${presentationUnits[i]}</small></p>`).join('')}</div><small>참고 비교이며, 이 한 조건으로 모델 성능을 판단하지 않습니다.</small>`
    : '<span>저장된 81조건 사이의 입력값</span><p>이 조건의 비교 해석값은 없습니다.</p>';
}

function decorateEvaluation() {
  if (!$('validationScores')) return;
  const k = +$('validationMetric').value, unit = presentationUnits[k];
  const score = (label, value, explanation, suffix) => `<div><span>${label}</span><b>${value}<small>${suffix}</small></b><p>${explanation}</p></div>`;
  $('validationScores').innerHTML = score('MAE', fmt(protoModel.mae[k]), '평균적으로 얼마나 빗나갔나 · 작을수록 좋음', unit)
    + score('RMSE', fmt(protoModel.rmse[k]), '큰 오차에 더 민감한 지표 · 작을수록 좋음', unit)
    + score('R²', protoModel.r2[k].toFixed(3), '1에 가까울수록 좋음 · 0은 평가 평균 예측 수준', '');
  const negative = protoModel.r2[k] < 0;
  if (negative) $('validationScores').insertAdjacentHTML('beforeend', '<p class="evaluation-alert">R²가 음수: 평가값의 평균만 예측한 경우보다 오차가 큽니다.</p>');
  const table = $('modelComparison').querySelector('table');
  if (table) table.insertAdjacentHTML('afterbegin', `<caption>같은 평가 25조건에서 모델 비교 · ${presentationOutputs[k]} (${unit})</caption>`);
  if ($('treeTarget')) $('treeTarget').value = $('validationMetric').value;
  $('validationPlot').querySelectorAll('text').forEach(text => {
    if (text.textContent === 'Moldflow 해석값' || text.textContent === '모델 예측값') text.textContent += ` (${unit})`;
  });
}

function decorateVideo() {
  $('charts').insertAdjacentHTML('afterbegin', '<div class="video-flow" aria-label="영상의 핵심 흐름"><div><b>01</b><span>PP + 소량의 CBA</span></div><i>›</i><div><b>02</b><span>가열 · 가스 발생</span></div><i>›</i><div><b>03</b><span>내부 셀 형성</span></div><small>원리 예시</small></div>');
}

function openPresentationNotes() {
  let dialog = $('presentationNotes');
  if (!dialog) {
    dialog = document.createElement('dialog'); dialog.id = 'presentationNotes';
    dialog.setAttribute('aria-labelledby', 'notesTitle'); document.body.append(dialog);
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  }
  const active = ['video', 'bubble', 'graph', 'heat', 'prediction'].find(key => $(key + 'Button').classList.contains('active'));
  const notes = {
    video: ['예시 영상', 'CBA에서 발생한 가스가 플라스틱 내부에 셀을 만듭니다.', '식빵은 내부 기공의 비유입니다. 영상은 원리 모식도입니다.', '다음: 버블 거동에서 가스량과 체적을 비교합니다.'],
    bubble: ['버블 거동', '같은 반지름이어도 가스량이 다르면 압력이 다릅니다.', '작은 셀 프리셋을 누르세요. 가스량 유지와 가스량 감소를 비교하세요.', '온도가 같은 가정의 상태 비교입니다. 실제 해석 결과의 원인을 증명한 것은 아닙니다.'],
    graph: ['공정변수별 그래프', '먼저 다른 조건을 고정하고, 선택한 변수의 변화를 봅니다.', '수준별 평균은 각 수준 27조건의 평균입니다. 전체 경향은 27개의 조건별 선입니다.', '평균에 가려지는 조건별 차이는 전체 경향에서 확인합니다. 원자료는 아래에서 펼칩니다.'],
    heat: ['상관분석', '피어슨 r로 두 값이 함께 변하는 방향과 직선 관계의 강도를 봅니다.', '칸을 누르면 81개의 점이 나타납니다. 부호는 방향, 절댓값은 강도입니다.', '|r| ≥ 0.4는 수업의 해석 기준입니다. 통계적 유의성이나 인과관계의 증명은 아닙니다.'],
    prediction: ['예측 모델', '81개 해석 중 56개로 학습하고, 나머지 25개로 성능을 확인합니다.', '예측해 보기에서 조건을 바꾸고, 성능 확인에서 세 모델을 비교합니다.', 'MAE·RMSE는 작을수록, R²는 1에 가까울수록 좋습니다. 실제 제품 실험을 검증한 결과는 아닙니다.']
  };
  const n = notes[active];
  dialog.innerHTML = `<form method="dialog"><header><h2 id="notesTitle">${n[0]} · 발표 메모</h2><button aria-label="발표 메모 닫기">×</button></header><p class="notes-line">${n[1]}</p><p>${n[2]}</p><p>${n[3]}</p><button class="notes-close">닫기</button></form>`;
  dialog.showModal();
}

decorateGraph();
