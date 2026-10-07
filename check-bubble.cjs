// Run with: node check-bubble.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const context = vm.createContext({});
vm.runInContext(html.match(/const data=([^\n]+)/)[0], context);
vm.runInContext(html.match(/const names=([^\n]+)/)[0], context);
vm.runInContext(fs.readFileSync(__dirname + '/focus-data.js', 'utf8'), context);
vm.runInContext(fs.readFileSync(__dirname + '/bubble.js', 'utf8'), context);
vm.runInContext(`
  const near = (a,b) => { if(Math.abs(a-b)>1e-10)throw Error(a+' != '+b); };
  for(const row of data)for(let axis=0;axis<4;axis++){
    bubbleState.axis=axis;bubbleState.fixed=row.slice(0,4);
    if(bubbleRow(row[axis])!==row)throw Error('Incorrect condition lookup');
  }
  bubbleState.axis=1;bubbleState.fixed=[1,205,150,90];
  near(bubbleRow(190)[5],.0176);near(bubbleRow(220)[6],2.675);
  for(const row of data){const core=bubbleCoreDensity(row),match=focusRows.find(r=>r.slice(0,4).every((v,i)=>v===row[i]));if(core!==(match?match[9]:null))throw Error('Core density from wrong condition');}
  if(bubbleTrend([1,2,3])!=='증가'||bubbleTrend([3,1,2])!=='일정한 방향 없음')throw Error('Trend must use all 3 levels');
  near(specimenVolume,29.314829369177076);
  const volume = count => growthExample(count).reduce((sum,c)=>sum+4*Math.PI*c.radius**3/3,0);
  if(Math.abs(volume(6)/volume(18)-1)>1e-12)throw Error('Illustration must conserve summed cell volume');
  if(!(growthExample(18)[0].radius<growthExample(6)[0].radius))throw Error('More cells must be smaller under equal volume assumption');
  near(focusRows[0][9],.7255);near(focusRows[1][9],.7114);near(focusRows[2][9],.6131);
`, context);
assert.equal((html.match(/id="bubbleButton"/g)||[]).length, 1);
assert.ok(html.indexOf('id="videoButton"') < html.indexOf('id="bubbleButton"'));
assert.ok(html.indexOf('id="bubbleButton"') < html.indexOf('id="graphButton"'));
console.log('PASS: all 81 condition lookups, corrected densities, geometry, tab order.');

assert.equal((html.match(/id="focusButton"/g)||[]).length,0);
