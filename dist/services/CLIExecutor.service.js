"use strict";
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
const select_1 = require("@inquirer/select");
const path = require("node:path");
const fs = require("fs");
const node_child_process_1 = require("node:child_process");
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
    CLIApp: ['commander', 'inquirer', 'chalk', ...commonInstallationPackages],
    node: [...commonInstallationPackages],
    react: ['vite', 'tailwind -D', 'postcss -D', 'autoprefixer -D', ...commonInstallationPackages],
    webServer: ['express', 'cors', 'axios', ...commonInstallationPackages],
};
;
;
class CLIExecutor {
    constructor(projectName) {
        this.projectName = projectName;
        this.projectSrcPath = path.resolve(`${projectName}`, 'src');
    }
    setUp() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const message = 'Quick start or go through setup?';
                const response = yield (0, select_1.default)({ message, choices: [{ value: 'Yes' }, { value: 'No' }] });
                if (response === 'Yes') {
                    //   continue with other setup  prompts
                }
                // execute necessary routines / functions
            }
            catch (err) {
                const message = 'an error occurred while running user through application setup';
                console.error(message, err);
            }
        });
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
    buildProject(chosenProject) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const npm = chosenProject !== "react" ? 'npm init -y' : null;
                const commands = {
                    normalInstall: 'npm install',
                    devInstall: 'npm install -D',
                    viteInstall: [`vite create ${this.projectName} --template react`, `cd ${this.projectName}`]
                };
                if (chosenProject === "react") {
                    yield CLIExecutor.executeCommands(commands.viteInstall);
                    return;
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
    buildProjectFolder() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pathToUse = process.cwd();
                yield fs.promises.mkdir(pathToUse, { recursive: false });
                console.log('finished');
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
    quickTree(item, flag) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let itemsStore = typeof item === 'string' ? [item] : [...item];
                for (const item of itemsStore) {
                    const pathToUse = path.resolve(this.projectSrcPath, item);
                    if (flag === "dir") {
                        yield fs.promises.mkdir(pathToUse, { recursive: false });
                    }
                    if (flag === 'file') {
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
