import {getDirectoryPath, copyListRemovingItem, combinePaths, fileExtensionIs, map, contains} from "./core";
import {Path} from "./types";
export type FileWatcherCallback = (path:string, removed?:boolean) => void;
export type DirectoryWatcherCallback = (path:string) => void;

export interface System {
    args: string[];
    newLine: string;
    useCaseSensitiveFileNames: boolean;
    write(s:string): void;
    readFile(path:string, encoding?:string): string;
    writeFile(path:string, data:string, writeByteOrderMark?:boolean): void;
    watchFile?(path:Path, callback:FileWatcherCallback): FileWatcher;
    watchDirectory?(path:string, callback:DirectoryWatcherCallback, recursive?:boolean): FileWatcher;
    resolvePath(path:string): string;
    fileExists(path:string): boolean;
    directoryExists(path:string): boolean;
    createDirectory(path:string): void;
    getExecutingFilePath(): string;
    getCurrentDirectory(): string;
    readDirectory(path:string, extension?:string, exclude?:string[]): string[];
    getMemoryUsage?(): number;
    exit(exitCode?:number): void;
}

interface WatchedFile {
    filePath: Path;
    callback: FileWatcherCallback;
    mtime?: Date;
}

export interface FileWatcher {
    close(): void;
}

export interface DirectoryWatcher extends FileWatcher {
    directoryPath: Path;
    referenceCount: number;
}

declare var require:any;
declare var module:any;
declare var process:any;
declare var global:any;
declare var __dirname:string;
declare var __filename:string;
declare var Buffer:{
    new (str:string, encoding?:string): any;
};

declare class Enumerator {
    public atEnd():boolean;

    public moveNext():boolean;

    public item():any;

    constructor(o:any);
}

declare var ChakraHost:{
    args: string[];
    currentDirectory: string;
    executingFile: string;
    newLine?: string;
    useCaseSensitiveFileNames?: boolean;
    echo(s:string): void;
    quit(exitCode?:number): void;
    fileExists(path:string): boolean;
    directoryExists(path:string): boolean;
    createDirectory(path:string): void;
    resolvePath(path:string): string;
    readFile(path:string): string;
    writeFile(path:string, contents:string): void;
    readDirectory(path:string, extension?:string, exclude?:string[]): string[];
    watchFile?(path:string, callback:FileWatcherCallback): FileWatcher;
    watchDirectory?(path:string, callback:DirectoryWatcherCallback, recursive?:boolean): FileWatcher;
};



var FS = require('fs')
var PT = require('path');

var LIB = FS.readFileSync(PT.resolve(__dirname,'../core/package.d.ts'),'utf8');
export var sys:System = <System>{
    args: [],
    newLine: '\n',
    useCaseSensitiveFileNames: true,
    write(s:string): void{},
    readFile(path:string, encoding?:string): string{
        switch(path){
            case 'hello.ts' : return `class Hello{}`;
            case 'lib.d.ts' : return LIB;
        }
    },
    writeFile(path:string, data:string, writeByteOrderMark?:boolean): void{
        console.info(path);
        console.info(data);
    },
    watchFile(path:Path, callback:FileWatcherCallback): FileWatcher{
        return null;
    },
    watchDirectory(path:string, callback:DirectoryWatcherCallback, recursive?:boolean): FileWatcher{
        return null;
    },
    resolvePath(path:string): string{
        return path;
    },
    fileExists(path:string): boolean{
        return true;
    },
    directoryExists(path:string): boolean{
        return true;
    },
    createDirectory(path:string): void{

    },
    getExecutingFilePath(): string{
        return ""
    },
    getCurrentDirectory(): string{
        return ""
    },
    readDirectory(path:string, extension?:string, exclude?:string[]): string[]{
        return []
    },
    getMemoryUsage(): number{
        return 0;
    },
    exit(exitCode?:number): void{
        
    }
};
