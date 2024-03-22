import * as fs from "fs";
import * as path from "node:path";
import * as EventEmitter from "node:events";
import {fileURLToPath} from "node:url";
import CLIExecutor from "./CLIExecutor.service.js";
import chalk, {ForegroundColorName} from "chalk";
import terminalLink from 'terminal-link';



interface GroupedtasksData{
    fileLocation:string,
    data:string[]
}

interface StoreStructure{
    data:string[];
    lastModified:Date | null;
    created:Date | null;
}
interface ReturnPs {
    highP:string[],
    moderateP:string[],
    lowP:string[]
}
const pathToTaskFile = 'file:'
class taskTracker{
    public cwd:string;
    public commentSignatureRegex:RegExp;
    // public supportedFiles:string[];
    public store:string[];
    public bulletsSignatureRegex:RegExp;
    public codeBaseLocation:string;
    readonly __dirName:string;
    readonly tasksLocation:string;
    readonly storeTasksEvent:EventEmitter;
    public doneTasksRegex:RegExp;

    constructor(){
        this.cwd = process.cwd();
        this.commentSignatureRegex =  /\/\*\s*((\n+-+>\s?\S?.*\s?)+)\s*\*\//gm;
        this.bulletsSignatureRegex = /-+>\s*\S*.*\n*/g;
        // this.supportedFiles = ['.ts', '.tsx', '.js', '.jsx'];
        this.store = [];
        this.codeBaseLocation = path.resolve(this.cwd, 'src');
        this.__dirName = path.dirname(fileURLToPath(import.meta.url))
        this.tasksLocation = path.resolve(this.__dirName,'..', '..', 'userData', 'taskTracker', 'tasks.data.json');
        this.storeTasksEvent = new EventEmitter.EventEmitter().on('storeTasks',()=>this.storeTasksHandler(this.tasksLocation));
        this.doneTasksRegex = /-+!>\s*\S*.*\n*/g;



    }

    static async readOperations(pathToFile:string, option?:{stream:boolean}):Promise<string | null | fs.ReadStream>{
        try{
            const streamData = option?.stream === true;
            if(!streamData){
                return await fs.promises.readFile(pathToFile, {encoding: 'utf-8'});
            }

            return fs.createReadStream(pathToFile, {encoding:"utf-8"});

        }
        catch(err){
            const message = 'an error occurred while reading file';
            console.error(message,err);
            return null;
        }
    }

    static async writeOperations(writePath:string,data:any, options?:{stream:boolean}):Promise<void | fs.WriteStream>{
        try{
            const streamable = options?.stream === true;
            if(!streamable){
                await fs.promises.writeFile(writePath,  data, {encoding:"utf-8"});
                return;
            }
            return fs.createWriteStream(writePath,{encoding:"utf-8"});
        }
        catch(err){
            const message = 'an error occurred while performing write operation';
            console.error(message, err);
            return;
        }
    };

    public async pipeStreams(writeStream:fs.WriteStream, readStream:fs.ReadStream, destination:string):Promise<{done:boolean}>{
        try{
            readStream.pipe(writeStream)
            writeStream.on('finish', ()=>{
                return {done:true};
            })
            return {done:false};
        }
        catch(err){
            const message = 'an error occurred while piping stream';
            console.error(message, err);
            return {done:false};
        }

    }


    public async searchTasksInCB():Promise<void>{
        try{
            CLIExecutor.logProgress('searchingTasksInCB started ...', 'working');
            await this.deleteTasksFromStore();
            const entryPointToUse = process.cwd();
            const files = await taskTracker.traverseDirTree(entryPointToUse,{result:true}) as string[];
            for(const file of files){
                const fileContent = await taskTracker.readOperations(file, {stream:false}) as string;
                const commentMatchArray = fileContent.match(this.commentSignatureRegex) as RegExpMatchArray;
                if(commentMatchArray === null){
                    continue;
                }
                const todoItems = commentMatchArray[0].match(this.bulletsSignatureRegex) as RegExpMatchArray;
                console.log('to do items',todoItems);
                const todoItemsMod = todoItems.map((item)=>{
                    return item.concat(`  ${pathToTaskFile} ${file}`);

                })


                this.store.push(...todoItemsMod);
            }
            console.log(this.store)




            this.storeTasksEvent.emit('storeTasks');
            CLIExecutor.logProgress('storing tasks done', 'success');
        }
        catch(err){
            const message = 'an error occurred while getting tasks from src files';
            console.error(message, err);
        }
    };
    private async storeTasksHandler(location:string):Promise<{success:boolean}>{

        try{

            const fileContent = await taskTracker.readOperations(location, {stream:false}) as string;
            const parsedData = JSON.parse(fileContent) as StoreStructure;
            parsedData.data.push(...this.store);
            const initiallyCreated = parsedData.created !== null;
            if(!initiallyCreated){
                parsedData.created = new Date();
            }

            parsedData.lastModified = new Date();

            await taskTracker.writeOperations(this.tasksLocation, JSON.stringify(parsedData), {stream:false});
            return {success:true};
        }
        catch(err){
            const message = 'an error occurred while storing tasks';
            console.error(message, err);
            return {success:false}

        }
    }



    static async isSupportedFile(filePath:string):Promise<boolean>{
        try{
            const supportedFiles = ['.ts', '.tsx', '.js', '.jsx'];
            const file = await fs.promises.stat(filePath);
            const isFile = file.isFile();
            const extName = path.extname(filePath);
            return supportedFiles.includes(extName) && isFile;

        }
        catch(err){
            const message = 'an error occurred while checking if file is a supported file';
            console.error(message, err);
            return false

        }

    }

    public async getTasksToDisplay(options?:{display:boolean}):Promise<string[] | null | void>{
        try{
            CLIExecutor.logProgress('started getting tasks to display', 'working');
            const storedContent = await taskTracker.readOperations(this.tasksLocation, {stream:false}) as string;
            const tasksArray = JSON.parse(storedContent) as StoreStructure;
            const data = tasksArray.data;
            if(options?.display === true){
                taskTracker.display(data);
                return
            }
            return data;
        }
        catch(err){
            const message = 'an error occurred while displaying tasks';
            return null;
        }
    };



    public async shakeTree(options?:{doneTasksOnly:boolean}):Promise<void>{
        try{
            CLIExecutor.logProgress('shaking Tree started', 'working')
            const targetLocation= process.cwd();
            const files =  await taskTracker.traverseDirTree(targetLocation,{result:true}) as string[];
            for (const file of files){
                const fileContent = await taskTracker.readOperations(file,{stream:false} ) as string;
                const regexToMatch:RegExp = options?.doneTasksOnly === true ? this.doneTasksRegex : this.commentSignatureRegex;
                const matches = fileContent.match(regexToMatch);
                if(matches == null){
                    continue;
                }
                const newFileContent = fileContent.replace(this.commentSignatureRegex, '');
                await taskTracker.writeOperations(file, newFileContent, {stream:false});

            }
            await this.deleteTasksFromStore();

            CLIExecutor.logProgress('tree shake complete', 'success');

        }
        catch(err){
            const message = 'an error occurred while shaking taskTree in codebase';
            console.error(message, err);
        }
    }

    static async traverseDirTree(treeLocation:string, options?:{result:boolean},callback?:(result:string[])=>void):Promise<void | string []>{
        try{
            let arraysToReturn: string[] = [];
             const dirItems = await fs.promises.readdir(treeLocation, {encoding:"utf-8"});
             for(const dirItem of dirItems){
                 const dirItemPath = path.resolve(treeLocation, dirItem);
                 const isSupportedFile = await taskTracker.isSupportedFile(dirItemPath);
                 const isDir = (await fs.promises.stat(dirItemPath)).isDirectory()
                 if(isSupportedFile){
                     arraysToReturn.push(dirItemPath)
                 }else if(isDir) {
                     const items = await taskTracker.traverseDirTree(dirItemPath, {result: true}) as string[];
                     arraysToReturn.push(...items);
                 }

             }

             if(options?.result === true && callback){
                 callback(arraysToReturn);
             }
            if(options?.result === true){
                return arraysToReturn;
            }

            throw new Error('wrong function usage');


        }
        catch(err){
            const message = 'an error occurred while traversing tree';
            console.error(message, err);
        }


    }

    public async deleteTasksFromStore():Promise<void>{
        try{
            CLIExecutor.logProgress('deleting tasks...', "working")
            const refreshedCont:StoreStructure = {
                data:[],
                created:null,
                lastModified:null
            };
            await taskTracker.writeOperations(this.tasksLocation,JSON.stringify(refreshedCont), {stream:false});
            CLIExecutor.logProgress('deleting tasks complete', 'success');

        }
        catch(err){
            const message = 'an error occurred while deleting tasks from store';
            console.error(message, err);
        }
    }

    // make algo sort tasks according to priority

    static display(tasks:string[]){
        console.log(terminalLink('test link', 'hello boy'))
        console.log(terminalLink.isSupported);

        const highPColour:ForegroundColorName = 'redBright';
        const moderatePColour:ForegroundColorName = 'blueBright';
        const lowPColour:ForegroundColorName = 'greenBright';


        const sortedTasks = taskTracker.priorityTaskSort(tasks);
        for(let key in sortedTasks){
           let colorToUse:ForegroundColorName = 'whiteBright';
           if(key === 'highP'){
               colorToUse = highPColour;
           }
           if(key === 'moderateP'){
               colorToUse = moderatePColour;
           }
           if(key === 'lowP'){
               colorToUse = lowPColour;
           }
           const  sortedTask = sortedTasks[key as keyof ReturnPs];
           sortedTask.forEach((task)=>{
               const filePath = task.split(pathToTaskFile);
               const filePathAsLink = terminalLink('file',filePath[1] );
               const newTask = `${filePath[0]} ${filePathAsLink}`;

               const [,main] = newTask.split('>');
               console.log(chalk[colorToUse](main));
           })


        }





    }

    static priorityTaskSort(tasksArray:string[]):ReturnPs{
        let highP:string[] = [];
        let moderateP:string[] = [];
        let lowP:string[] = [];

        tasksArray.forEach((task)=>{
            const [first, second] = task.split('>');
            if(first.length <= 3 ){
                lowP.push(task);
            }
            if(first.length > 3 && first.length <= 5){
                moderateP.push(task);

            }

            if(first.length > 5){
                highP.push(task);
            }


        });


        return {highP, moderateP , lowP};


    }




}

export default taskTracker;
