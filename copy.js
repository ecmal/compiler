let FS = require("fs");
let PT = require("path");

let tsDir = PT.resolve(__dirname,".")
let toDir = PT.resolve(__dirname,".");

function transformJs(){
    let jsContent = FS.readFileSync(PT.resolve(tsDir,'typescript.js'),'utf8')
    jsContent = jsContent.replace('"TSL:HEADER";',`System.register("@ecmal/compiler/index",[],function(exported,module){`);
    jsContent = jsContent.replace('"TSL:FOOTER";',`});`);
    jsContent = jsContent.replace('typescript.js.map',`index.js.map`);
    
    FS.writeFileSync(PT.resolve(toDir,'index.js'),jsContent,'utf8');
}
function transformDts(){
    let dtsContent = FS.readFileSync(PT.resolve(tsDir,'typescript.d.ts'),'utf8')
    dtsContent = dtsContent + `\nexport = ts;\nexport as namespace ts;\n`;
    FS.writeFileSync(PT.resolve(toDir,'index.d.ts'),dtsContent,'utf8');
}
function transformMap(){
    let dtsContent = FS.readFileSync(PT.resolve(tsDir,'typescript.js.map'),'utf8')
    FS.writeFileSync(PT.resolve(toDir,'index.js.map'),dtsContent,'utf8');
}
transformJs();
transformDts();
transformMap();