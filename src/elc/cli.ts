namespace ts.elc {
    let optionNameMapCache: OptionNameMap;
    let optionDeclarations:CommandLineOption[] = [
        {name:"watch",shortName:"w",type:"boolean"},
        {name:"target",shortName:"t",type:"string"}
    ];
    export function cla(args:string[]){
        function getOptionNameMap(optionDeclarations:CommandLineOption[]): OptionNameMap {
            if (optionNameMapCache){
                return optionNameMapCache;
            }
            const optionNameMap = createMap<CommandLineOption>();
            const shortOptionNames = createMap<string>();
            forEach(optionDeclarations, option => {
                optionNameMap.set(option.name.toLowerCase(), option);
                if (option.shortName) {
                    shortOptionNames.set(option.shortName, option.name);
                }
            });
            optionNameMapCache = { optionNameMap, shortOptionNames };
            return optionNameMapCache;
        }
        const options: CompilerOptions = {};
        const projects: string[] = [];
        const errors: Diagnostic[] = [];
        const { optionNameMap, shortOptionNames } = getOptionNameMap(optionDeclarations);

        parseStrings(args);
        return {
            options,
            projects,
            errors
        };

        function parseStrings(args: string[]) {
            let i = 0;
            while (i < args.length) {
                let s = args[i];
                i++;
                if (s.charCodeAt(0) === CharacterCodes.minus) {
                    s = s.slice(s.charCodeAt(1) === CharacterCodes.minus ? 2 : 1).toLowerCase();

                    // Try to translate short option names to their full equivalents.
                    const short = shortOptionNames.get(s);
                    if (short !== undefined) {
                        s = short;
                    }

                    const opt = optionNameMap.get(s);
                    if (opt) {
                        if (opt.isTSConfigOnly) {
                            errors.push(createCompilerDiagnostic(Diagnostics.Option_0_can_only_be_specified_in_tsconfig_json_file, opt.name));
                        }
                        else {
                            // Check to see if no argument was provided (e.g. "--locale" is the last command-line argument).
                            if (!args[i] && opt.type !== "boolean") {
                                errors.push(createCompilerDiagnostic(Diagnostics.Compiler_option_0_expects_an_argument, opt.name));
                            }

                            switch (opt.type) {
                                case "number":
                                    options[opt.name] = parseInt(args[i]);
                                    i++;
                                    break;
                                case "boolean":
                                    // boolean flag has optional value true, false, others
                                    const optValue = args[i];
                                    options[opt.name] = optValue !== "false";
                                    // consume next argument as boolean flag value
                                    if (optValue === "false" || optValue === "true") {
                                        i++;
                                    }
                                    break;
                                case "string":
                                    options[opt.name] = args[i] || "";
                                    i++;
                                    break;
                                case "list":
                                    const result = parseListTypeOption(<CommandLineOptionOfListType>opt, args[i], errors);
                                    options[opt.name] = result || [];
                                    if (result) {
                                        i++;
                                    }
                                    break;
                                // If not a primitive, the possible types are specified in what is effectively a map of options.
                                default:
                                    options[opt.name] = parseCustomTypeOption(<CommandLineOptionOfCustomType>opt, args[i], errors);
                                    i++;
                                    break;
                            }
                        }
                    }
                    else {
                        errors.push(createCompilerDiagnostic(Diagnostics.Unknown_compiler_option_0, s));
                    }
                }
                else {
                    projects.push(s);
                }
            }
        }        
    }
}