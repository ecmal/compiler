var exec = require('child_process').execSync;
var path = require('fs');
var fs = require('fs');

//var out = '/Users/Sergey/Work/BB/ecmal/elp/out/compiler';
var out = './src';

exec('jake',{
    cwd     : './typescript',
    stdio   : 'inherit',
    env     : process.env
});

var jsBody = fs.readFileSync('./typescript/built/local/typescript.js','utf8');
var dtsBody = fs.readFileSync('./typescript/built/local/typescript.d.ts','utf8');
var jsContent = [
    'system.register("compiler/index", [], function(system,module) {',
    jsBody.split('\n').map(function (l){return '  '+l}).join('\n'),
    '  module.export("TypeScript", ts);',
    '  module.export("default",ts);',
    '  return {setters:[],execute:function(){}}',
    '});'
].join('\n');
var dtsContent = dtsBody.replace('export = ts;','export default ts;');
fs.writeFileSync(out+'/index.js',jsContent);
fs.writeFileSync(out+'/index.d.ts',dtsContent);