namespace ts {
    const ElpDiagnostics = Object.assign(Diagnostics,{
        Project_name : {
            category    : DiagnosticCategory.Message,
            key         : "Project_name",
            code        : 20001,
            message     : "Project Name"
        }
    });
    ts.optionDeclarations.push({
        name:"name",
        type:"string",
        shortName:"n",
        category:ElpDiagnostics.Command_line_Options,
        description:ElpDiagnostics.Project_name
    });
    export interface CompilerOptions {
        name?:string;
    }
    let superGetResolvedExternalModuleName = ts.getResolvedExternalModuleName;
    let superGetExternalModuleNameFromPath = ts.getExternalModuleNameFromPath;
    
    ts.getResolvedExternalModuleName = function getResolvedExternalModuleName(host: EmitHost, file: SourceFile): string {
        let moduleName;
        let compilerOptions = host.getCompilerOptions();
        if(compilerOptions.name){
            file.moduleName = moduleName = getExternalModuleNameFromPath(host,file.fileName);
        }else{
            moduleName = superGetResolvedExternalModuleName(host,file)
        }
        return moduleName;
    }
    ts.getExternalModuleNameFromPath = function getExternalModuleNameFromPath(host: EmitHost, fileName: string): string {
        let moduleName = superGetExternalModuleNameFromPath(host,fileName);
        let compilerOptions = host.getCompilerOptions();
        if(compilerOptions.name){
            moduleName = `${compilerOptions.name}/${moduleName}`;
        }
        return moduleName;
    }
}