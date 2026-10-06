// Source: the user's corrected Google Sheet, read 2026-10-06.
// Only these three conditions are currently in scope. Core density is not a bulk average.
const focusSource = 'https://docs.google.com/spreadsheets/d/14_fSGZI3BPZbKjwi7fBr8eoa4g82ip2MLP32IxYyDUU/edit#gid=747014466';
const specimenDimensions = { diameter:108, thickness:3.2 };
const specimenVolume = Math.PI * specimenDimensions.diameter ** 2 * specimenDimensions.thickness / 4000;
function specimenGeometryCard(){
  return `<article class="geometry-card"><h2>시편 치수와 체적</h2>
  <svg viewBox="0 0 320 130" role="img" aria-label="지름 108 mm, 두께 3.2 mm 원형 평판">
    <defs><linearGradient id="plateTone" x2="0" y2="1"><stop stop-color="#d9e7f2"/><stop offset="1" stop-color="#a7c4dc"/></linearGradient></defs>
    <path d="M55 59 A90 29 0 0 1 235 59 V75 A90 29 0 0 1 55 75Z" fill="#98b8d2" stroke="#668ba9"/>
    <ellipse cx="145" cy="59" rx="90" ry="29" fill="url(#plateTone)" stroke="#668ba9"/>
    <path d="M55 109V119 M55 114H235 M235 109V119 M251 59H266 M251 82H266 M261 59V82" fill="none" stroke="#486d92"/>
    <text x="145" y="129" text-anchor="middle" font-size="11" fill="#365575">지름 108 mm</text><text x="271" y="75" font-size="11" fill="#365575">3.2 mm</text>
  </svg><div class="geometry-volume"><span>치수 기준 체적</span><strong>${specimenVolume.toFixed(3)} <small>cm³</small></strong></div>
  <p>V = πd²t / 4 · 세 조건 동일 · 코어밀도로 환산하지 않음<br><a href="${focusSource}" target="_blank" rel="noopener noreferrer">수정된 원자료 ↗</a></p></article>`;
}
// Columns: CBA, temperature, speed, VP, mass, radius, pressure max, pressure mean,
// bubble number density, core density. Source rows: 18, 45, 72; headers A:I and X.
const focusRows = [[1,190,150,90,21.37,0.0176,2.125,2.125,32620000,0.7255],[1,205,150,90,21.13,0.0154,2.389,1.195,69520000,0.7114],[1,220,150,90,20.94,0.0118,2.675,1.337,98510000,0.6131]];
