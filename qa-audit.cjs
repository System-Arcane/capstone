// Repeatable numerical checks, independent of browser rendering.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const context = vm.createContext({});
for (const name of ['data', 'names', 'correlations', 'modelBank']) {
  vm.runInContext(html.match(new RegExp('^const ' + name + '=.*$', 'm'))[0], context);
}
for (const name of ['focus-data.js', 'bubble.js', 'foaming-process.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, name), 'utf8'), context);
}
vm.runInContext(html.match(/^function evaluateModel.*$/m)[0], context);
vm.runInContext(html.match(/^function meanRowsByLevel.*$/m)[0], context);
const {data, levels, correlations, modelBank, focusRows} = vm.runInContext('({data,levels,correlations,modelBank,focusRows})', context);
const near = (a,b,why) => assert.ok(Math.abs(a-b) <= 1e-7*Math.max(1,Math.abs(a),Math.abs(b)), `${why}: ${a} != ${b}`);
assert.equal(data.length,81);
assert.equal(new Set(data.map(r=>r.slice(0,4).join('/'))).size,81);
for (const row of data) assert.ok(row.every(Number.isFinite));
for (let axis=0;axis<4;axis++) for (const level of levels[axis]) {
  assert.equal(data.filter(r=>r[axis]===level).length,27);
}
// The three equally weighted level means must recover the overall mean.
for (let axis=0;axis<4;axis++) {
  const means=vm.runInContext(`meanRowsByLevel(data,${axis})`,context);
  assert.deepEqual(Array.from(means,r=>r[axis]),Array.from(levels[axis]));
  for (let column=4;column<9;column++) {
    near(means.reduce((sum,r)=>sum+r[column],0)/3,data.reduce((sum,r)=>sum+r[column],0)/81,'balanced level means');
    for(const mean of means){
      const group=data.filter(r=>r[axis]===mean[axis]).map(r=>r[column]);
      assert.ok(mean[column]>=Math.min(...group)&&mean[column]<=Math.max(...group));
    }
  }
}
function pearson(x,y) {
  const mx=x.reduce((a,b)=>a+b,0)/x.length,my=y.reduce((a,b)=>a+b,0)/y.length;
  return x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0)/Math.sqrt(x.reduce((s,v)=>s+(v-mx)**2,0)*y.reduce((s,v)=>s+(v-my)**2,0));
}
const outputs=[4,5,7,8];
for(let i=0;i<4;i++)for(let j=0;j<4;j++) {
  near(pearson(data.map(r=>r[outputs[i]]),data.map(r=>r[outputs[j]])),correlations.results[i][j],'result correlation');
  near(pearson(data.map(r=>r[i]),data.map(r=>r[outputs[j]])),correlations.factors[i][j],'factor correlation');
}
for(const [key,model] of Object.entries(modelBank)) {
  assert.equal(model.actual.length,25);assert.equal(model.predicted.length,25);
  for(let j=0;j<4;j++) {
    const y=model.actual.map(r=>r[j]),p=model.predicted.map(r=>r[j]);
    assert.ok([...y,...p].every(Number.isFinite));
    const mean=y.reduce((a,b)=>a+b,0)/25;
    const mse=y.reduce((s,v,i)=>s+(p[i]-v)**2,0)/25;
    near(y.reduce((s,v,i)=>s+Math.abs(p[i]-v),0)/25,model.mae[j],key+' MAE');
    near(Math.sqrt(mse),model.rmse[j],key+' RMSE');
    near(1-mse*25/y.reduce((s,v)=>s+(v-mean)**2,0),model.r2[j],key+' R2');
  }
  for(const row of data) {
    context.qaInputs=row.slice(0,4);context.qaModel=key;
    assert.ok(vm.runInContext('evaluateModel(qaModel,qaInputs)',context).every(Number.isFinite));
  }
}
for(const row of focusRows) {
  const original=data.find(r=>r.slice(0,4).every((v,i)=>v===row[i]));
  assert.ok(original);for(let i=4;i<9;i++)near(original[i],row[i],'focus result preservation');
}
for(const ref of html.matchAll(/(?:src|href)="([^"?#]+)(?:[^\"]*)"/g)) {
  if(!ref[1].includes('://')&&!ref[1].startsWith('#'))assert.ok(fs.existsSync(path.join(__dirname,ref[1])),ref[1]);
}
for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(script[1].trim())new vm.Script(script[1]);
new vm.Script(fs.readFileSync(path.join(__dirname,'presentation.js'),'utf8'));
console.log('PASS: 81 unique factorial conditions, 32 Pearson coefficients, 36 model metrics, 243 model evaluations, corrected subset, local assets, script syntax.');
