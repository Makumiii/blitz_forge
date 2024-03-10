"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const CLIExecutor_service_1 = __importDefault(require("./CLIExecutor.service"));
const rawlist_1 = __importDefault(require("@inquirer/rawlist"));
const prompts_1 = require("@inquirer/prompts");
const path = __importStar(require("node:path"));
class CLIInterface {
    constructor() {
        this.program = new commander_1.Command();
        this.programVersion = '1.0.0';
        this.programDescription = 'interface for blitz_forge scaffolding tool and inline task manager';
        this.projectName = '';
        this.commandsExecutorClass = new CLIExecutor_service_1.default(this.projectName);
    }
    configureCommands() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.program
                    .version(this.programVersion)
                    .description(this.programDescription);
                yield this.scaffoldInterface();
                this.program.parse(process.argv);
            }
            catch (err) {
                const message = 'an error occurred while configuring commands';
                console.error(message, err);
            }
        });
    }
    scaffoldInterface() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('program acknowledged');
                this.program
                    .command('project')
                    .argument('[projectName]', 'name of the project being created')
                    .argument('[projectType]', 'name of the type of project that the user intends to scaffold')
                    .option('-i, --init', 'initialize with a guided setup')
                    .action((projectName, projectType, options) => __awaiter(this, void 0, void 0, function* () {
                    if (options.init) {
                        // first step: get project name
                        const userInputProjectName = yield (0, prompts_1.input)({
                            message: 'enter the name of your project',
                        });
                        // second step: select project to scaffold
                        const userChosenProject = yield (0, rawlist_1.default)({
                            message: 'select a project type that you wish to scaffold',
                            choices: [
                                { name: 'cli', value: 'cli' },
                                { name: 'react', value: 'react' },
                                { name: 'node', value: 'node' },
                                { name: 'web server', value: 'webserver' }
                            ]
                        });
                        yield this.commandsExecutorClass.buildProject(userChosenProject, userInputProjectName);
                        return;
                    }
                    yield this.commandsExecutorClass.buildProject(projectType, projectName);
                }));
            }
            catch (err) {
                const message = 'an error occurred while processing scaffolding interface';
                console.error(message, err);
                return;
            }
        });
    }
    archInSrcInterface() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.program
                    .command('arch')
                    .argument('<folders>', 'folders to create in src')
                    .argument('<destination>', 'where to create the folders, relative path')
                    .action((folders, destination) => __awaiter(this, void 0, void 0, function* () {
                    const pathToCreateFolders = path.resolve(process.cwd(), 'src', destination);
                }));
            }
            catch (err) {
                const message = 'an error occurred while building archInSrc interface';
                console.error(message, err);
            }
        });
    }
}
exports.default = CLIInterface;
