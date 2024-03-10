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
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("node:path"));
const fs = __importStar(require("fs"));
const node_child_process_1 = require("node:child_process");
const projectTypes = ["react", "node", "cli", "webserver"];
const mvc = ['models', 'controllers', 'views'];
const layered = ['controllers', 'models', 'services'];
;
;
const configsExt = {
    tailwind: { name: 'tailwind', ext: '.config.cjs' },
    postcss: { name: 'postcss', ext: '.config.cjs' },
    ts: { name: 'tsconfig', ext: '.json' },
    nodemon: { name: 'nodemon', ext: '.json' }
};
const commonInstallationPackages = ['typescript'];
const packagesToInstall = {
    cli: ['commander', 'inquirer', 'chalk', ...commonInstallationPackages],
    node: [...commonInstallationPackages],
    react: ['vite', 'tailwind -D', 'postcss -D', 'autoprefixer -D', ...commonInstallationPackages],
    webserver: ['express', 'cors', 'axios', ...commonInstallationPackages],
};
;
;
class CLIExecutor {
    constructor(projectName) {
        this.projectName = projectName;
        this.projectSrcPath = path.resolve(`${projectName}`, 'src');
        this.userProjectName = '';
    }
    static injectConfig(config, writeLocation) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tempsLocation = path.resolve(__dirname, '..', 'temps', config);
                if ((yield fs.promises.stat(tempsLocation)).isFile()) {
                    const file = yield fs.promises.readFile(tempsLocation, 'utf-8');
                    yield fs.promises.writeFile(writeLocation, file);
                    return true;
                }
                ;
                throw new Error('template is not a valid file');
            }
            catch (err) {
                const message = 'an error occurred while injecting config to user project';
                console.error(message, err);
                return false;
            }
        });
    }
    buildArchIntoSrc(load, writeLocation, overrideSrc) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const override = overrideSrc !== undefined;
                for (const folder in load) {
                    const creationLocation = override ? path.resolve(overrideSrc === null || overrideSrc === void 0 ? void 0 : overrideSrc.dirLocation, folder) : writeLocation;
                    yield fs.promises.mkdir(creationLocation, { recursive: false });
                }
                const success = true;
                return { success };
            }
            catch (err) {
                const message = 'an error occurred while building architecture in src';
                console.error(message, err);
                const success = false;
                return { success };
            }
        });
    }
    static executeCommands(command) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let commandsStore = [];
                if (typeof command === "string") {
                    commandsStore.push(command);
                }
                commandsStore = commandsStore.concat(command);
                for (const command of commandsStore) {
                    yield new Promise((resolve, reject) => {
                        (0, node_child_process_1.exec)(command, (error, stdout, stderr) => {
                            const message = 'an error occurred during command execution';
                            if (stderr || error) {
                                console.error(message, error);
                                reject(error || stderr);
                            }
                            resolve();
                        });
                    });
                }
                return;
            }
            catch (err) {
                const message = 'an error occurred while executing specified commands';
                console.error(message, err);
            }
        });
    }
    buildProject(chosenProject, preferredProjName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.userProjectName = preferredProjName;
                yield CLIExecutor.buildProjectFolder(preferredProjName);
                const npm = chosenProject !== "react" ? 'npm init -y' : null;
                const commands = {
                    normalInstall: 'npm install',
                    devInstall: 'npm install -D',
                    viteInstall: [`vite create ${preferredProjName} --template react`]
                };
                if (chosenProject === "react") {
                    yield CLIExecutor.executeCommands(commands.viteInstall);
                    return;
                }
                if (!projectTypes.includes(chosenProject)) {
                    const message = 'input project is not valid';
                    throw new Error(message);
                }
                const commandsToExecute = packagesToInstall[chosenProject];
                yield CLIExecutor.executeCommands([npm, ...commandsToExecute]);
                return;
            }
            catch (err) {
                const message = 'an error occurred while executing commands';
                console.error(message, err);
                return;
            }
        });
    }
    static buildProjectFolder(projectName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pathToUse = path.resolve(process.cwd(), projectName);
                yield fs.promises.mkdir(pathToUse, { recursive: false });
                const pathToNavigateTo = path.resolve(process.cwd(), projectName);
                process.chdir(pathToNavigateTo);
                console.log('finished creating project folder and navigating into it');
            }
            catch (err) {
                const message = 'an error occurred while building project';
                console.error(message, err);
            }
        });
    }
    readTemplateConfigs(config, folder) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const extName = configsExt[config].ext;
                const tempLocation = path.resolve(__dirname, '..', 'temps', folder, `${config}.${extName}`);
                return yield fs.promises.readFile(tempLocation, { encoding: "utf-8" });
            }
            catch (err) {
                const message = 'an error occurred while reading template configs';
                console.error(message, err);
                return null;
            }
        });
    }
    writeConfigsIntoProject(data, writeDestination) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dflt = process.cwd();
                const destination = writeDestination === undefined ? dflt : writeDestination;
                yield fs.promises.writeFile(destination, data, { encoding: 'utf-8' });
            }
            catch (err) {
                const message = 'an error occurred while writing configs into project';
                console.error(message, err);
            }
        });
    }
    quickTree(item, fileType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let itemsStore = typeof item === 'string' ? [item] : [...item];
                for (const item of itemsStore) {
                    const pathToUse = path.resolve(this.projectSrcPath, item);
                    if (fileType === "dir") {
                        yield fs.promises.mkdir(pathToUse, { recursive: false });
                    }
                    if (fileType === 'file') {
                        yield fs.promises.writeFile(pathToUse, '', { encoding: 'utf-8' });
                    }
                }
                console.log('making quick tree is a success');
            }
            catch (err) {
                const message = 'an error occurred while making quickTree';
                console.error(message, err);
            }
        });
    }
}
exports.default = CLIExecutor;
