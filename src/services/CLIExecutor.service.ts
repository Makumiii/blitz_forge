import select, {Separator} from '@inquirer/select'
import * as path from "node:path";
import * as fs from "fs";
import {exec} from "node:child_process";

type Temps = 'ts' | 'tailwind' | 'eslint' | 'nodemon' | 'postcss';
type Project = 'react' | 'node' | 'webServer' | 'CLIApp';
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
    CLIApp:['commander', 'inquirer', 'chalk', ...commonInstallationPackages],
    node:[...commonInstallationPackages],
    react:['vite', 'tailwind -D', 'postcss -D', 'autoprefixer -D',...commonInstallationPackages],
    webServer:['express', 'cors', 'axios', ...commonInstallationPackages],
} as const


interface Response<T> {
    success:boolean,
    data?:T
};
interface Executables{
    [type:string]:string[]
};


class CLIExecutor{
    constructor(private projectName:string) {
    }
    public async setUp():Promise<void>{
        try{
            const message = 'Quick start or go through setup?';
            const response = await select({message, choices:[{value:'Yes'}, {value:'No'}]});
            if(response === 'Yes'){
            //   continue with other setup  prompts
            }
            // execute necessary routines / functions

        }
        catch(err){
            const message = 'an error occurred while running user through application setup';
            console.error(message, err);
        }



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

    public async buildProject(chosenProject:Project):Promise<void>{

        const npm = chosenProject !== "react" ? 'npm init -y' : null;
        if(npm !== null){

            exec(npm,(error, stdout, stderr)=>{
                const message = 'could not execute command';
                if(error){
                    console.error(message, error);
                }
                if(stderr){
                    console.error(message, stderr);
                }
            })
        }
        interface commands{
            normalInstall:string,
            devInstall:string,
            viteInstall:string[]
        }

        const commands : commands = {
            normalInstall:'npm install',
            devInstall:'npm install -D',
            viteInstall:[`vite create ${this.projectName} --template react`, `cd ${this.projectName}`]
        } as const;

        packagesToInstall[chosenProject].forEach((pckg)=>{
            const command = pckg.includes('-D') ? commands.devInstall : commands.normalInstall;

            exec(command)

        })





    }
}

export default CLIExecutor
