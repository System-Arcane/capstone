// Run with: node check-bubble.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const context = vm.createContext({});
vm.runInContext(html.match(/const data=([^\n]+)/)[0], context);
vm.runInContext(html.match(/const names=([^\n]+)/)[0], context);
vm.runInContext(fs.readFileSync(__dirname + '/bubble.js', 'utf8'), context);
vm.runInContext(`
  const near = (a,b) => { if(Math.abs(a-b)>1e-10)throw Error(a+' != '+b); };
  for(const mode of ['volume','both'])for(const progress of [0,.1,.5,.9,1]){
    const r=bubbleRatios(mode,progress);
    near(r.radius**3,r.volume);near(r.pressure*r.volume,r.gas);
    if(mode==='both')near(r.pressure,1);
  }
  near(bubbleRatios('volume',1).pressure,2);
  near(bubbleRatios('both',1).gas,.5);
  for(const row of data)for(let axis=0;axis<4;axis++){
    bubbleState.axis=axis;bubbleState.fixed=row.slice(0,4);
    if(bubbleRow(row[axis])!==row)throw Error('Incorrect condition lookup');
  }
  bubbleState.axis=1;bubbleState.fixed=[1,205,150,90];
  near(bubbleRow(190)[5],.0176);near(bubbleRow(220)[6],2.675);
`, context);
assert.equal((html.match(/id="bubbleButton"/g)||[]).length, 1);
assert.ok(html.indexOf('id="videoButton"') < html.indexOf('id="bubbleButton"'));
assert.ok(html.indexOf('id="bubbleButton"') < html.indexOf('id="graphButton"'));
console.log('PASS: state equations, radius/volume relation, 324 condition lookups, tab order.');
