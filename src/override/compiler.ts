//process.env.TSS_LOG = `-level DEBUG -file "${process.cwd()}/server.log"`;
namespace ts {
    declare var console:any;
    let superConfigFileParser = ts.parseJsonConfigFileContent;
    function findNodeModulesPath(searchPath,host:ParseConfigHost){
        while (true) {
            const nodeDir = normalizePath(combinePaths(searchPath, "node_modules"));
            if (host.fileExists(nodeDir)){
                return nodeDir;
            }
            const parentPath = normalizePath(getDirectoryPath(searchPath));
            if (parentPath === searchPath) {
                break;
            }
            searchPath = parentPath;
        }
        return void 0;
    }
    function detectOutDir(file:string,json:any,host:ParseConfigHost){
        let outDir:string = getDirectoryPath(file);
        if(endsWith(outDir,json.name)){
            outDir = normalizePath(combinePaths(outDir,json.name.split('/').map(()=>'..').join('/')))
        }else
        if(json.directories && json.directories.out){
            outDir = normalizePath(combinePaths(outDir,json.directories.out))
        }else{
            outDir = findNodeModulesPath(outDir,host);
        }
        return normalizePath(combinePaths(outDir,json.name)); 
    }
    function detectTypeRoots(file:string,json:any,host:ParseConfigHost){
        let typeRoot:string = getDirectoryPath(file);
        if(endsWith(typeRoot,json.name)){
            typeRoot = normalizePath(combinePaths(typeRoot,json.name.split('/').map(()=>'..').join('/')))
        }else
        if(json.directories && json.directories.out){
            typeRoot = normalizePath(combinePaths(typeRoot,json.directories.out))
        }else{
            typeRoot = findNodeModulesPath(typeRoot,host);
        }
        return typeRoot; 
    }
    function parseJsonConfigFileContent(json: any, host: ParseConfigHost, basePath: string, existingOptions: CompilerOptions = {}, configFileName?: string, resolutionStack: Path[] = [], extraFileExtensions: JsFileExtensionInfo[] = []): ParsedCommandLine {
        let compilerOptions:any = {
            name                    : json.name,
            module                  : "system",
            moduleResolution        : "node",
            target                  : "es5",
            declaration             : true,
            jsxFactory              : "JSX",
            jsx                     : "react",
            sourceMap               : true,
            experimentalDecorators  : true,
            emitDecoratorMetadata   : true,
            noEmitHelpers           : true,
            importHelpers           : true,
        }
        let outDir = detectOutDir(configFileName,json,host);
        let mainFile = json.main||'index.js';
        let typeRoot = detectTypeRoots(configFileName,json,host);
        if(typeRoot){
            compilerOptions.typeRoots=[typeRoot];
        }

        let exclude = [`${outDir}/**/*`];

        if(json.bundle){
            compilerOptions.outFile = combinePaths(outDir,mainFile);
        }else{
            compilerOptions.outDir = outDir;
        }
        let types:string[] = [];
        function addDependencies(deps){
            if(deps){
                types = types.concat(Object.keys(deps))
            }
        }
        addDependencies(json.libraries);
        addDependencies(json.dependencies);
        addDependencies(json.devDependencies);
        if(types.length){
            types = types.filter((e,i,a)=>(e && a.indexOf(e)==i));
            compilerOptions.types = types;
        }
        let result = superConfigFileParser({compilerOptions,exclude},host,basePath,existingOptions,configFileName,resolutionStack,extraFileExtensions)
        //console.info(JSON.stringify({json,result},null,2));
        console.info("Project Reload");
        return result;
    }
    Object.defineProperty(ts,'parseJsonConfigFileContent',{value:parseJsonConfigFileContent})
}