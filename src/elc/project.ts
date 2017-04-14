
namespace ts {
    declare const console:any;
    export interface ProjectOptions {
        name:string;
        main?:string;
        bundle?:boolean;
        directories?:{
            src?:string,
            out?:string
        },
        release?:boolean,
        libraries?:MapLike<string>;
        dependencies?:MapLike<string>;
        devDependencies?:MapLike<string>;
    }
    export interface ProjectServiceOptions {
        watch?:boolean;
        target?:string;
    }

    export class Project {
        public readonly service:ProjectService;
        public readonly options:ProjectOptions;
        private cached:any;
        private program:Program;
        private host:CompilerHost;
        private filename:string;
        private dirname:string;
        private compileTimer:any;
        private configFileWatcher:FileWatcher;
        private sourceDirectoryWatcher:FileWatcher;
        private sourceFileWatchers:Map<FileWatcher>;

        public getId():string{
            return this.filename;
        }
        public getName(){
            return this.options.name;
        }
        public getMainFileName(){
            return this.options.main||"index.js";
        }
        public isLibrary(){
            return endsWith(this.dirname,this.getName());
        }
        public isBundle(){
            return this.options.bundle;
        }
        public isWatchMode(){
            return this.service.getOptions().watch
        }
        public getOutputDir(){
            if(!this.cached.outputDir){
                this.cached.outputDir = normalizePath(combinePaths(
                    this.getTargetDir(),
                    this.getName()
                ));
            }
            return this.cached.outputDir;
        }
        public getOutputFile(){
            if(!this.cached.outputFile){
                this.cached.outputFile = normalizePath(combinePaths(
                    this.getOutputDir(),
                    this.getMainFileName()
                ));
            }
            return this.cached.outputFile;
        }
        public getOutputProjectFile(){
            if(!this.cached.outputProjectFile){
                this.cached.outputProjectFile = normalizePath(combinePaths(
                    this.getOutputDir(),'package.json'
                ));
            }
            return this.cached.outputProjectFile;
        }
        public getTargetDir(){
            if(!this.cached.targetDir){
                let serviceTarget = this.service.getOptions().target;
                if(serviceTarget){
                    serviceTarget = normalizePath(combinePaths(
                        this.getHost().getCurrentDirectory(),serviceTarget
                    ));
                }
                
                if(serviceTarget){
                    this.cached.targetDir = serviceTarget;
                }else{
                    let dirs = this.options.directories;
                    let rel = (dirs && dirs.out)?dirs.out:'.';
                    if(this.isLibrary()){
                        rel = this.getName().split('/').map(()=>'..').join('/')
                    }
                    rel = normalizePath(combinePaths(this.dirname,rel));
                    this.cached.targetDir = rel;
                }               
            }
            return this.cached.targetDir;
        }
        public hasDependencies(){
            return this.getDependencyNames().length;
        }
        public getDependencies(){
            if(!this.cached.dependencies){
                let deps:any = {};
                let addDeps = (map:MapLike<string>)=>{
                    if(map){
                        Object.keys(map).forEach(n=>{
                            deps[n] = normalizePath(combinePaths(this.getTargetDir(),`${n}/package.json`));
                        })
                    }
                }
                addDeps(this.options.libraries);
                addDeps(this.options.dependencies);
                addDeps(this.options.devDependencies);
                this.cached.dependencies = deps;
            }
            return this.cached.dependencies;
        }
        public getDependencyNames(){
            return Object.keys(this.getDependencies())
        }
        public getHost(){
            return this.service.getHost();   
        }
        public getSourceDir(){
            if(!this.cached.sourceDir){
                let dirs = this.options.directories;
                let rel = (dirs && dirs.src)?dirs.src:'.';
                rel = normalizePath(combinePaths(this.dirname,rel));
                this.cached.sourceDir = rel;
            }
            return this.cached.sourceDir;
        }
        public getSourceFiles():string[]{
            if(!this.cached.sourceFiles){
                this.cached.sourceFiles = this.getHost().readDirectory(this.getSourceDir(),['.ts']);
            }
            return this.cached.sourceFiles;
        }
        public getCompilerOptions(){
            if(!this.cached.compilerOptions){
                let opts:CompilerOptions = {
                    name                    : this.getName(),
                    module                  : ModuleKind.System,
                    moduleResolution        : ModuleResolutionKind.NodeJs,
                    target                  : ScriptTarget.ES5,
                    noLib                   : true,
                    declaration             : true,
                    jsx                     : JsxEmit.React,
                    sourceMap               : true,
                    experimentalDecorators  : true,
                    emitDecoratorMetadata   : true,
                    stripInternal           : true,
                    noEmitHelpers           : true,
                    importHelpers           : true,
                    noEmitOnError           : true,
                }
                if(this.isBundle()){
                    opts.outFile = this.getOutputFile();
                }else{
                    opts.outDir = this.getOutputDir();
                }                
                if(this.hasDependencies()){
                    opts.typeRoots = [this.getTargetDir()];
                    opts.types = this.getDependencyNames();
                }
                this.cached.compilerOptions = opts;
            }
            return this.cached.compilerOptions;
        }
        public getOutputOptions(){
            let options:ProjectOptions = JSON.parse(JSON.stringify(this.options));
            options.release = true;
            if(options.directories){
               delete options.directories.out;
               delete options.directories.src;
            }
            return options;
        }
        public getOutputOptionsContent(){
            return JSON.stringify(this.getOutputOptions(),null,2);
        }
        public getReporter(){
            return this.service.getReporter();
        }
        constructor(service:ProjectService,filename:string,options:ProjectOptions){
            this.service = service;
            this.cached = {};
            this.options = options;
            this.filename = filename;
            this.dirname = getDirectoryPath(filename);
            this.sourceFileWatchers = createMap<FileWatcher>();
        }
        compile(){
            this.doCompile();
            if(this.isWatchMode()){
                this.watch();
            }
        }
        watch(){
            this.getReporter().reportWatchDiagnostic(Diagnostics.Compilation_complete_Watching_for_file_changes);
            this.sourceDirectoryWatcher = this.getHost().watchDirectory(this.getSourceDir(),f=>this.onDirectoryChange(f),true);
            this.configFileWatcher = this.getHost().watchFile(this.filename,(f)=>this.onConfigFileChange(f));
            this.getSourceFiles().forEach(f=>{
                this.sourceFileWatchers.set(f,this.getHost().watchFile(f,(f)=>this.onFileChange(f)));
            })
        }
        private doCompile(){
            let isNew = !this.program;
            if(!isNew){
                this.getReporter().reportWatchDiagnostic(Diagnostics.File_change_detected_Starting_incremental_compilation);
            }
            let sourceFiles = this.getSourceFiles();
            this.host = createCompilerHost(this.getCompilerOptions());
            this.program = createProgram(sourceFiles,this.getCompilerOptions(),this.host,this.program);
            let result = this.program.emit();
            if(result.diagnostics.length){
                this.service.getReporter().reportAll(sortAndDeduplicateDiagnostics(result.diagnostics))
            }else{
                this.host.writeFile(this.getOutputProjectFile(),this.getOutputOptionsContent(),false);
            }
            if(this.isWatchMode()){
                this.sourceFileWatchers.forEach((w,k)=>{
                    //file removed;
                    if(sourceFiles.indexOf(k)<0){
                        w.close();
                        this.sourceFileWatchers.delete(k);
                    }
                });
                sourceFiles.forEach(f=>{
                    //file added;
                    if(!this.sourceFileWatchers.has(f)){
                        this.sourceFileWatchers.set(f,this.getHost().watchFile(f,(f)=>this.onFileChange(f)));
                    }
                });
                if(!isNew){
                this.service.getReporter().reportWatchDiagnostic(Diagnostics.Compilation_complete_Watching_for_file_changes);
                }
            }            
        }
        private onConfigFileChange(filename: string){
             this.getReporter().reportCompilerDiagnostic({
                 message    : "Config file {0} changed",
                 category   : DiagnosticCategory.Warning,
                 code       : 32000,
                 key        : "config_file_changed"
             },filename);
        }
        private onFileChange(filename: string){
            if(ts.isSupportedSourceFileName(filename,this.getCompilerOptions())){
                if(this.compileTimer){
                    clearTimeout(this.compileTimer)
                }
                this.compileTimer = setTimeout(()=>{
                    this.cached.sourceFiles = void 0;
                    this.doCompile()
                },200);
            }
        }
        private onDirectoryChange(filename:string){
            if(ts.isSupportedSourceFileName(filename,this.getCompilerOptions())){
                if(this.compileTimer){
                    clearTimeout(this.compileTimer)
                }
                this.compileTimer = setTimeout(()=>{
                    this.cached.sourceFiles = void 0;
                    this.doCompile()
                },200);
            }
        }
    }
    export class DiagnosticReporter {
        protected host:FormatDiagnosticsHost;
        constructor(){
            this.host = {
                getCurrentDirectory: () => sys.getCurrentDirectory(),
                getNewLine: () => sys.newLine,
                getCanonicalFileName: createGetCanonicalFileName(sys.useCaseSensitiveFileNames)
            }
        }
        public reportAll(diagnostics: Diagnostic[]): void {
            for (const diagnostic of diagnostics) {
                this.report(diagnostic);
            }
        } 
        public report(diagnostic:Diagnostic){
            sys.write(this.formatDiagnostics([diagnostic]));
        }
        public reportCompilerDiagnostic(message: DiagnosticMessage, ...args: (string | number)[]){
            this.report(createCompilerDiagnostic(message,...args))
        }
        public reportWatchDiagnostic(message: DiagnosticMessage,...args: (string | number)[]) {
            let diagnostic = createCompilerDiagnostic(message,...args)
            let output = new Date().toLocaleTimeString() + " - ";
            if (diagnostic.file) {
                const loc = getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
                output += `FILE: ./${ diagnostic.file.fileName }(${ loc.line + 1 },${ loc.character + 1 }): `;
            }
            output += `${ flattenDiagnosticMessageText(diagnostic.messageText, sys.newLine) }${sys.newLine}`;
            sys.write(output);
        }
        protected formatDiagnostics(diagnostics: Diagnostic[]): string {
            let output = "";
            for (const diagnostic of diagnostics) {
                if (diagnostic.file) {
                    const { line, character } = getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
                    const fileName = diagnostic.file.fileName;
                    const relativeFileName = convertToRelativePath(fileName, this.host.getCurrentDirectory(), fileName => this.host.getCanonicalFileName(fileName));
                    output += `./${relativeFileName}(${line + 1},${character + 1}): `;
                }
                const category = DiagnosticCategory[diagnostic.category].toLowerCase();
                output += `${category} TS${diagnostic.code}: ${flattenDiagnosticMessageText(diagnostic.messageText, this.host.getNewLine())}${this.host.getNewLine()}`;
            }
            return output;
        }
    }
    export class ProjectService {
        protected options:ProjectServiceOptions;
        protected host:System;
        protected reporter:DiagnosticReporter;
        protected projects:Map<Project>;
        public getOptions(){
            return this.options;
        }
        constructor (options:ProjectServiceOptions,reporter:DiagnosticReporter){
            this.options = options;
            this.host = sys;
            this.reporter = reporter
            this.projects = createMap<Project>();
        }
        public getReporter(){
            return this.reporter;
        }
        public getHost(){
            return this.host;
        }
        public addProject(project:Project){
            let deps = project.getDependencies();
            Object.keys(deps).forEach(k=>{
                this.openProject(deps[k]);
            })
            this.projects.set(project.getId(),project);
            return project;
        }
        public openProject(file:string):Project{
            file = normalizePath(combinePaths(this.host.getCurrentDirectory(),file))
            let config = (()=>{
                if(this.host.fileExists(file)){
                    let content:string;
                    try{
                        content = this.host.readFile(file);
                    }catch(e){
                        this.reporter.reportCompilerDiagnostic(Diagnostics.Cannot_read_file_0_Colon_1, file, e.message);
                        return;
                    }
                    let {error,config} = parseConfigFileTextToJson(file,content);
                    if(error){
                        return this.reporter.report(error);
                    }else{
                        return config;
                    }
                }else{
                    return this.reporter.reportCompilerDiagnostic(Diagnostics.File_0_does_not_exist, file);
                }
            })();
            if(config){
                return this.addProject(this.newProject(file,config));
            }
        }
        public newProject(file:string,config:any):Project{
            return new Project(this,file,config)
        }
        public print(){
            this.projects.forEach(e=>{
                console.info((e.isLibrary()?"Library":"Project")+' '+e.getName(),{
                    deps : Object.keys(e.getDependencies())
                })
            })
        }
    }
    export function execute(args:string[]){
        let cla = ts.elc.cla(args);
        let service = new ProjectService(cla.options as any, new DiagnosticReporter());
        cla.projects.forEach(config=>{
            service.openProject(config).compile();
        })
    }
}