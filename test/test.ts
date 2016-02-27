import {createProgram, getPreEmitDiagnostics} from "compiler/program"
import {CompilerOptions, ScriptTarget, ModuleKind} from "compiler/types";

function compile(fileNames: string[], options: CompilerOptions): void {
    let program = createProgram(fileNames, options);
    let emitResult = program.emit();

    let allDiagnostics = getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        console.info(diagnostic);
    });

    let exitCode = emitResult.emitSkipped ? 1 : 0;
    console.log(`Process exiting with code '${exitCode}'.`);
}



declare var process:any;
compile(['hello.ts'], {
    noEmitOnError: true, noImplicitAny: true,
    target: ScriptTarget.ES5, module: ModuleKind.CommonJS
});