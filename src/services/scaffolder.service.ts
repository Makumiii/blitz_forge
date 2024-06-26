import * as path from "node:path";
import * as fs from "fs";
import {exec} from "node:child_process";
import chalk, {BackgroundColorName, ForegroundColorName} from 'chalk'
import {fileURLToPath} from "node:url";
import packageJson from '../../package.json';
import {promisify} from "node:util";

const allowedProjectFileExtension:string[] = ['.js', '.ts', '.tsx', '.jsx', '.json', '.css', '.html','.ejs' ] as const;

type Temps = 'ts' | 'tailwind' | 'eslint' | 'nodemon' | 'postcss';
export type Project = 'react' | 'node' | 'webserver' | 'cli';
const projectTypes: Project[] = ["react", "node", "cli", "webserver"];
interface Ext{
    name:string,
    ext:string
};
interface  configsExt{
    [configName:string]:Ext
};
const configsExt:configsExt = {
    tailwind : {name:'tailwind', ext:'.config.cjs'},
    postcss : {name:'postcss', ext:'.config.cjs'},
    ts : {name:'tsconfig', ext:'.json'},
    nodemon:{name:'nodemon', ext:'.json'}
} as const;
const commonInstallationPackages : string[] = ['typescript', 'nodemon -D', 'ts-node -D'];
interface Response<T> {
    success:boolean,
    data?:T
}
const packagesToInstall : {[key in Project]:string[]} = {
    cli:['commander', 'inquirer', 'chalk', ...commonInstallationPackages],
    node:[...commonInstallationPackages],
    react:['vite','react','react-dom', 'tailwind -D', 'postcss -D', 'autoprefixer -D',...commonInstallationPackages],
    webserver:['express', 'cors', 'axios', ...commonInstallationPackages],
} as const

const commonTemps: Partial <Temps>[] = ['ts', 'nodemon'];

const configsToInstall : {[key in Project]:Partial <Temps>[]} = {
    cli:[...commonTemps],
    webserver:[...commonTemps],
    node:[...commonTemps],
    react:[]
}
interface Executables{
    [type:string]:string[]
};




class Scaffolder {
    private projectSrcPath : string;
    public userProjectName : string;
    public projectRootPath : string;
    public __dirName: string;
    public quickTreeRegex: RegExp;
    constructor(private projectName:string){
        this.projectSrcPath = path.resolve(`${projectName}`, 'src');
        this.userProjectName = '';
        this.projectRootPath = path.resolve(process.cwd(), this.projectName);
        this.__dirName = path.dirname(fileURLToPath(import.meta.url));
        this.quickTreeRegex = /a/;
    }
    static async createConfigsIntoProject(config:Temps, writeLocation:string):Promise<void>{
        try{
            Scaffolder.logProgress('copying configs into project', 'working');
            const fileName = configsExt[config].name + configsExt[config].ext;
            const defaultTempsLocation = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..',  'temps' ,'default',);
            const defaultConfigs = await fs.promises.readdir(defaultTempsLocation, {encoding:'utf-8'});
            const foundConfig = defaultConfigs.find((_)=> _.includes(config));
            if(foundConfig !== undefined){
                const configPath = path.resolve(defaultTempsLocation, foundConfig);

                if((await fs.promises.stat(configPath)).isFile()){
                    const file = await fs.promises.readFile(configPath, 'utf-8');
                    const newWriteLocation = path.resolve(writeLocation, fileName);
                    await fs.promises.writeFile(newWriteLocation,file);
                    Scaffolder.logProgress('writing config done', 'success')
                    return;
                }
                throw new Error('template is not a valid file');

            }

            throw new Error('config specified template config not found');
        }
        catch(err){
            const message = 'an error occurred while injecting config to user project';
            console.error(message, err);
            return;

        }
    }





    static async executeCommands(command:string | string[]):Promise<void>{
        try{
            let commandsStore: string[] = [];
            if(typeof command === "string"){
                commandsStore.push(command as string)
            }else{
                commandsStore = commandsStore.concat(command as string[])
            }
            console.log('commandStore', commandsStore);

            for(const command of commandsStore){
                Scaffolder.logProgress(`executing: ${command}`, 'working');
                const execPromise = promisify(exec);
                const {stderr, stdout} = await execPromise(command)
                if(stderr){
                    console.log('an error occurred while executing commands', stderr)
                }
                if(stdout){
                    console.log(stdout)
                }

                Scaffolder.logProgress(`executing:${command} done`, 'success');


            }
            Scaffolder.logProgress('execution of commands complete', 'success');
            return
        }
        catch(err){
            const message = 'an error occurred while executing specified commands';
            console.error(message, err);
        }



    }

    public async buildProject(chosenProject:Project, preferredProjName:string):Promise<void>{
        try{
            Scaffolder.logProgress('building project started', 'working');

            this.userProjectName = preferredProjName;
            this.projectRootPath = path.resolve(process.cwd(), preferredProjName);

            await Scaffolder.buildProjectFolder(preferredProjName);
            interface commands{
                normalInstall:string,
                devInstall:string,
            }
            const npm = 'npm init -y';
            const commands : commands = {
                normalInstall:'npm install',
                devInstall:'npm install -D',
            } as const;

            if(!projectTypes.includes(chosenProject)){
                const message = 'input project is not valid';
                throw new Error(message);

            }
            const commandsToExecute = packagesToInstall[chosenProject];
            const mergedCommandsToExecute = commandsToExecute.map((command)=>{
                const commandType = command.includes('-D') ? commands.devInstall : commands.normalInstall;
                const newCommand = command.includes('-D') ? command.replace('-D', '').trim() : command.trim();

                return `${commandType} ${newCommand}`;
            });
            await Scaffolder.executeCommands([npm as string, ...mergedCommandsToExecute]);

            // add required project templates configuration
            const configsToBeCreated = configsToInstall[chosenProject];
            for(const currentConfig of configsToBeCreated){
                await Scaffolder.createConfigsIntoProject(currentConfig,this.projectRootPath );

            }
            //add scripts to build ts and run nodemon to package.json
            await this.addScriptsToPackageJson();



        }
        catch(err){
            const message = 'an error occurred while executing commands';
            console.error(message, err);
            return;
        }

    }

    static async buildProjectFolder(projectName:string):Promise<void>{
        try{
            const pathToUse = path.resolve(process.cwd(), projectName);
            await fs.promises.mkdir(pathToUse, {recursive:false});
            const pathToNavigateTo = path.resolve(process.cwd(),projectName );
            process.chdir(pathToNavigateTo);
            Scaffolder.logProgress('building project Folder success', 'success' );

        }
        catch(err){
            const message = 'an error occurred while building project';
            console.error(message, err);
        }

    }

    public async quickTree(items:string[],fileType?:'dir' | 'file', options?:{nestedArg:boolean}):Promise<void>{

        try{
            Scaffolder.logProgress('building quick tree...', "working");
            for(const item of items){
                if(options?.nestedArg === true){
                    const splitLoad = item.split('-');
                    if(splitLoad.length > 2){
                        throw new Error('pattern not recognized');
                    }
                    const parentDir = splitLoad[0];
                    const children = splitLoad[1];
                    const pathToUse = path.resolve(process.cwd(), parentDir);
                    await fs.promises.mkdir(pathToUse);
                    const nestedItems = children.split(' ');
                    for(const nestedItem of nestedItems){
                        const nestedItemPath = path.resolve(pathToUse,nestedItem);
                        const isValidFile =allowedProjectFileExtension.includes( path.extname(nestedItemPath));
                        if(isValidFile){
                            await fs.promises.writeFile(nestedItemPath,'',{encoding:"utf-8"})
                        }
                        await fs.promises.mkdir(nestedItemPath)
                    }
                    continue


                }
                const pathToUse = path.resolve(process.cwd(), item);

                if(fileType === "dir"){
                    await fs.promises.mkdir(pathToUse, {recursive:false});
                }
                if(fileType === 'file'){
                    await fs.promises.writeFile(pathToUse, '', {encoding:'utf-8'});
                }
            }

            Scaffolder.logProgress('building quick tree complete', 'success');
        }
        catch(err){
            const message = 'an error occurred while making quickTree';
            console.error(message, err);
        }
    }

    static logProgress(logMessage:string, logType:'err' | 'success'| 'working',color?:ForegroundColorName ):void{
        console.clear()
        if(logType !== "err" && logType !== "success" && logType !== 'working'){
            console.error('logType is not valid');
        }

        let logColour: ForegroundColorName = 'blueBright';
        if(logType === 'success'){
            logColour = 'greenBright';
        }
        if(logType === 'err'){
            logColour = 'redBright';
        }
        if(logType === 'working'){
            logColour = 'yellowBright'
        }
        if(color !== undefined){
            logColour = color;
        }
        console.log(chalk[logColour](logMessage));

    }

    private async addScriptsToPackageJson():Promise<void>{
        try{
            const pathToFile = path.resolve(this.projectRootPath, 'package.json');

            //read package.json in user project root
            const packageJsonCont = JSON.parse(await fs.promises.readFile(pathToFile, {encoding:"utf-8"}));
            // add scripts to scripts prop
            interface ScriptsToAdd extends Partial<typeof packageJson.scripts>{}

            const scriptsToAddToJson : ScriptsToAdd = {

                    test: "echo \"Error: no test specified\" && exit 1",
                    start: "nodemon",
                    build: "tsc -p . --watch"
            }
            packageJsonCont.scripts = scriptsToAddToJson;

            //write new scripts to the package.json

            await fs.promises.writeFile(pathToFile,JSON.stringify(packageJsonCont), {encoding:'utf-8'});
            return;


        }catch(err){
            const message = 'an error occurred while adding scripts to package json';
            console.error(message, err);
        }

    }



}

export default Scaffolder
