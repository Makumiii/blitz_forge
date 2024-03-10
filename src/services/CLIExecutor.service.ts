import select, {Separator} from '@inquirer/select'
import * as path from "node:path";
import * as fs from "fs";
import {exec} from "node:child_process";

type Temps = 'ts' | 'tailwind' | 'eslint' | 'nodemon' | 'postcss';
export type Project = 'react' | 'node' | 'webserver' | 'cli';
const projectTypes: Project[] = ["react", "node", "cli", "webserver"];
const mvc = ['models','controllers', 'views']  as const;
const layered = ['controllers', 'models', 'services'] as const;
type Architectures = typeof mvc | typeof layered;
type CustomArchitecture = string[];
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
const commonInstallationPackages : string[] = ['typescript'];
const packagesToInstall : {[key in Project]:string[]} = {
    cli:['commander', 'inquirer', 'chalk', ...commonInstallationPackages],
    node:[...commonInstallationPackages],
    react:['vite', 'tailwind -D', 'postcss -D', 'autoprefixer -D',...commonInstallationPackages],
    webserver:['express', 'cors', 'axios', ...commonInstallationPackages],
} as const




interface Response<T> {
    success:boolean,
    data?:T
};
interface Executables{
    [type:string]:string[]
};

type todos = 'critical' | 'highPriority' | 'medium' | 'low' | 'optional';



class CLIExecutor{
    private projectSrcPath : string;
    public userProjectName : string;
    constructor(private projectName:string){
        this.projectSrcPath = path.resolve(`${projectName}`, 'src');
        this.userProjectName = '';
    }
    static async injectConfig(config:Temps, writeLocation:string):Promise<boolean>{
        try{
            const tempsLocation = path.resolve(__dirname,'..', 'temps' , config);
            if((await fs.promises.stat(tempsLocation)).isFile()){
                const file = await fs.promises.readFile(tempsLocation, 'utf-8');
                await fs.promises.writeFile(writeLocation,file)
                return true;
            };
            throw new Error('template is not a valid file');

        }
        catch(err){
            const message = 'an error occurred while injecting config to user project';
            console.error(message, err);
            return false;

        }
    }



    public async buildArchIntoSrc(load:Architectures | CustomArchitecture, writeLocation:string,overrideSrc?:{dirLocation:string}):Promise<Response<any>>{
        try{
            const override = overrideSrc !== undefined;
            for(const folder in load){
                const creationLocation = override ? path.resolve(overrideSrc?.dirLocation, folder) : writeLocation;
                await fs.promises.mkdir(creationLocation, {recursive:false});
            }
            const success = true;
            return {success}
        }
        catch(err){
            const message = 'an error occurred while building architecture in src';
            console.error(message, err);
            const success = false;
            return {success}
        }

    }

    static async executeCommands(command:string | string[]):Promise<void>{
        try{
            let commandsStore: string[] = [];
            if(typeof command === "string"){
                commandsStore.push(command as string)
            }
            commandsStore = commandsStore.concat(command as string[])

            for(const command of commandsStore){

                await new Promise<void>((resolve, reject)=>{

                    exec(command,(error, stdout, stderr) =>{
                        const message = 'an error occurred during command execution';
                        if(stderr || error){
                            console.error(message,error);
                            reject(error || stderr)
                        }

                        resolve()


                    } )

                })


            }
            return
        }
        catch(err){
            const message = 'an error occurred while executing specified commands';
            console.error(message, err);
        }



    }

    public async buildProject(chosenProject:Project, preferredProjName:string):Promise<void>{
        try{
            this.userProjectName = preferredProjName;

            await CLIExecutor.buildProjectFolder(preferredProjName);
            interface commands{
                normalInstall:string,
                devInstall:string,
                viteInstall:string[]
            }
            const npm = chosenProject !== "react" ? 'npm init -y' : null;
            const commands : commands = {
                normalInstall:'npm install',
                devInstall:'npm install -D',
                viteInstall:[`vite create ${preferredProjName} --template react`]
            } as const;
            if(chosenProject === "react"){
                await CLIExecutor.executeCommands(commands.viteInstall);
                return
            }
            if(!projectTypes.includes(chosenProject)){
                const message = 'input project is not valid';
                throw new Error(message);

            }


            const commandsToExecute = packagesToInstall[chosenProject];
            await CLIExecutor.executeCommands([npm as string, ...commandsToExecute]);
            return;

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
            console.log('finished creating project folder and navigating into it');

        }
        catch(err){
            const message = 'an error occurred while building project';
            console.error(message, err);
        }

    }

    public async readTemplateConfigs(config:Temps , folder:'custom' | 'default'):Promise<string | null>{
        try{
            const extName = configsExt[config].ext;
            const tempLocation = path.resolve(__dirname, '..', 'temps' , folder, `${config}.${extName}`);
            return await fs.promises.readFile(tempLocation, {encoding:"utf-8"});

        }
        catch(err){
            const message = 'an error occurred while reading template configs';
            console.error(message, err);
            return null;

        }
    }

    public async writeConfigsIntoProject (data:string,writeDestination?: string):Promise<void>{
        try{
            const dflt = process.cwd();
            const destination = writeDestination === undefined ? dflt : writeDestination;
            await fs.promises.writeFile(destination, data , {encoding:'utf-8'} );


        }
        catch(err){
            const message = 'an error occurred while writing configs into project';
            console.error(message,err);
        }
    }

    public async quickTree(item:string | string[],fileType:'dir' | 'file'):Promise<void>{

        try{
            let itemsStore :string[] = typeof item === 'string' ? [item] : [...item];
            for(const item of itemsStore){
                const pathToUse = path.resolve(this.projectSrcPath, item);
                if(fileType === "dir"){

                    await fs.promises.mkdir(pathToUse, {recursive:false});

                }
                if(fileType === 'file'){
                    await fs.promises.writeFile(pathToUse, '', {encoding:'utf-8'});

                }
            }
            console.log('making quick tree is a success');
        }
        catch(err){
            const message = 'an error occurred while making quickTree';
            console.error(message, err);
        }
    }



}

export default CLIExecutor
