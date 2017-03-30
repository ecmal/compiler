//process.env.TSS_LOG = `-level DEBUG -file "${process.cwd()}/server.log"`;
namespace ts.server {
    function findConfigFile(searchPath: NormalizedPath): NormalizedPath {
        while (true) {
            const projectConfig = asNormalizedPath(combinePaths(searchPath, "package.json"));
            if (this.host.fileExists(projectConfig)) {
                return projectConfig;
            }
            const parentPath = asNormalizedPath(getDirectoryPath(searchPath));
            if (parentPath === searchPath) {
                break;
            }
            searchPath = parentPath;
        }
        throw new Error("Project file not found");
    }
    let superConfigFileParser = ts.parseJsonConfigFileContent;
    function findNodeModulesPath(searchPath,host:ParseConfigHost){
        while (true) {
            const nodeDir = asNormalizedPath(combinePaths(searchPath, "node_modules"));
            if (host.fileExists(nodeDir)){
                return nodeDir;
            }
            const parentPath = asNormalizedPath(getDirectoryPath(searchPath));
            if (parentPath === searchPath) {
                break;
            }
            searchPath = parentPath;
        }
        return void 0;
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
            module                  : "system",
            moduleResolution        : "node",
            target                  : "es5",
            declaration             : true,
            jsxFactory              : "JSX",
            jsx                     : "react",
            experimentalDecorators  : true,
            emitDecoratorMetadata   : true,
            noEmitHelpers           : true,
            importHelpers           : true,
            //outDir : combinePaths(getDirectoryPath(configFilename),"out")
            outFile                 : combinePaths(getDirectoryPath(configFileName),"out/index.js")
        }
        let typeRoot = detectTypeRoots(configFileName,json,host);
        if(typeRoot){
            compilerOptions.typeRoots=[typeRoot];
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
        return superConfigFileParser({compilerOptions},host,basePath,existingOptions,configFileName,resolutionStack,extraFileExtensions);
    }
    Object.defineProperty(ts,'parseJsonConfigFileContent',{value:parseJsonConfigFileContent});
    Object.defineProperty(ProjectService.prototype,'findConfigFile',{value:findConfigFile});
}