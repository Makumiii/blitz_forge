import * as fs from "fs";
import * as path from "node:path";
import {fileURLToPath} from "node:url";
import Scaffolder from "./scaffolder.service.js";
import chalk, {ForegroundColorName} from "chalk";
import terminalLink from 'terminal-link';

/*
->add single comment todos alongside existing multi-line comment todos
--------------->refactor functionality for saving todos to md file so that it is saved in specified project dir and not the applications dir
 */
interface StoreStructure{
    data:string[];
    lastModified:Date | null;
    matchedFiles:string[];
}
interface ReturnPs {
    highP:string[],
    moderateP:string[],
    lowP:string[]
}
interface quickStats{
    matchedFiles:string[],
    totalTasks:number,

}
const fileDelim = 'file:'
class TasksHandler {
    public cwd:string;
    public commentSignatureRegex:RegExp;
    public store:string[];
    public bulletsSignatureRegex:RegExp;
    public codeBaseLocation:string;
    readonly __dirName:string;
    readonly tasksLocation:string;
    public doneTasksRegex:RegExp;
    public markdownLocation:string;
    constructor(){
        this.cwd = process.cwd();
        this.commentSignatureRegex =  /\/\*\s*(\n?-+!?>\s?\S?.*\s*)+\s*\*\//gm;
        this.bulletsSignatureRegex = /-+!?>\s*\S*.*/gm;
        this.store = [];
        this.codeBaseLocation = path.resolve(this.cwd, 'src');
        this.__dirName = path.dirname(fileURLToPath(import.meta.url))
        this.tasksLocation = path.resolve(this.__dirName,'..', '..', 'userData', 'tasks.data.json');
        this.doneTasksRegex = /-+!>\s*\S*.*/gm;
        this.markdownLocation = path.resolve(this.__dirName, '..','..','TODOS.blitz.md');

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

                await fs.promises.writeFile(writePath,data,{encoding:"utf-8"});
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

    public async pipeStreams(writeStream:fs.WriteStream, readStream:fs.ReadStream):Promise<{done:boolean}>{
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

    };


    public async searchTasksInCB():Promise<void>{
        try{
            Scaffolder.logProgress('searchingTasksInCB started ...', 'working');
            // await this.deleteTasksFromStore();
            const entryPointToUse = process.cwd();
            const files = await TasksHandler.traverseDirTree(entryPointToUse,{result:true}) as string[];
            for(const file of files){
                const fileContent = await TasksHandler.readOperations(file, {stream:false}) as string;
                const commentMatchArray = fileContent.match(this.commentSignatureRegex) as RegExpMatchArray;
                if(commentMatchArray === null){
                    continue;
                }
                const todoItems = commentMatchArray[0].match(this.bulletsSignatureRegex) as RegExpMatchArray;
                const todoItemsMod = todoItems.map((item)=>{
                    return item.concat(`  ${fileDelim} ${file}`);

                })
                this.store.push(...todoItemsMod);
            }
            Scaffolder.logProgress("tasks found", 'success');
            await this.storeTasks(this.tasksLocation);
        }
        catch(err){
            const message = 'an error occurred while getting tasks from src files';
            console.error(message, err);
        }
    };
    private async storeTasks(location:string):Promise<{success:boolean}>{
        try{
            Scaffolder.logProgress('storing tasks has begun', 'working')
            const dataToBeStored:StoreStructure = {
                data:this.store,
                lastModified:new Date(),
                matchedFiles:this.retrieveFiles()

            }
            const json = JSON.stringify(dataToBeStored);
            await TasksHandler.writeOperations(this.tasksLocation,json,{stream:false});
            await this.saveToMd('src')
            Scaffolder.logProgress('storing tasks complete', 'success');
            return {success:true}
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
            Scaffolder.logProgress('started getting tasks to display', 'working');
            const storedContent = await TasksHandler.readOperations(this.tasksLocation, {stream:false}) as string;
            const tasksArray = JSON.parse(storedContent) as StoreStructure;
            const data = tasksArray.data;
            if(options?.display === true){
                TasksHandler.display(data);
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
            Scaffolder.logProgress('shaking Tree started', 'working')
            const targetLocation= process.cwd();
            const files =  await TasksHandler.traverseDirTree(targetLocation,{result:true}) as string[];
            for (const file of files){
                const fileContent = await TasksHandler.readOperations(file,{stream:false} ) as string;
                const regexToMatch:RegExp = options?.doneTasksOnly === true ? this.doneTasksRegex : this.commentSignatureRegex;
                const matches = fileContent.match(regexToMatch);
                if(matches == null){
                    continue;
                }
                const newFileContent = fileContent.replace(regexToMatch, '');
                await TasksHandler.writeOperations(file, newFileContent, {stream:false});

            }
            await this.deleteTasksFromStore();
            await this.searchTasksInCB();

            Scaffolder.logProgress('tree shake complete', 'success');

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
                 const isSupportedFile = await TasksHandler.isSupportedFile(dirItemPath);
                 const isDir = (await fs.promises.stat(dirItemPath)).isDirectory()
                 if(isSupportedFile){
                     arraysToReturn.push(dirItemPath)
                 }else if(isDir) {
                     const items = await TasksHandler.traverseDirTree(dirItemPath, {result: true}) as string[];
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
            Scaffolder.logProgress('deleting tasks...', "working");
            const data = JSON.stringify({
                data:[],
                lastModified:null,
                matchedFiles:[]
            } as StoreStructure)
            await TasksHandler.writeOperations(this.tasksLocation,data, {stream:false})
            Scaffolder.logProgress('deleting tasks complete', 'success');
        }
        catch(err){
            const message = 'an error occurred while deleting tasks from store';
            console.error(message, err);
        }
    }

    // make algo sort tasks according to priority

    static display(tasks:string[]){


        const highPColour:ForegroundColorName = 'redBright';
        const moderatePColour:ForegroundColorName = 'blueBright';
        const lowPColour:ForegroundColorName = 'greenBright';


        const sortedTasks = TasksHandler.priorityTaskSort(tasks);
        let assignedTaskNumber = 1;

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
           sortedTask.forEach((task, i)=>{
               const filePath = task.split(fileDelim);
               const relativePath = path.relative(process.cwd(), filePath[1]);
               const filePathAsLink = chalk["bgWhiteBright"](terminalLink('file',relativePath ));
               const newTask = `${filePath[0].toUpperCase()} ${filePathAsLink}`;

               const [,main] = newTask.split('>');
               const newMain = `${assignedTaskNumber }. ${main}`;
               assignedTaskNumber++;
               console.log(chalk[colorToUse](newMain));
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
    private retrieveFiles():string[]{
        const files = this.store.map((item)=>{
            return item.split(fileDelim)[1].trim();
        })
        const  mergedFileLocations:Set<string> = new Set();
        files.forEach((file)=>{
            mergedFileLocations.add(file)
        })
        return Array.from(mergedFileLocations);
    }
    public async quickStats():Promise<quickStats | null>{
        try{
            interface quickStats{
                matchedFiles:string[],
                totalTasks:number,

            }
            const json = await TasksHandler.readOperations(this.tasksLocation, {stream:false}) as string;
            const object = JSON.parse(json) as StoreStructure;
            const matchedFiles = object.matchedFiles, totalTasks = object.data.length;
            return {matchedFiles, totalTasks}

        }
        catch(err){
            const message = 'an error occurred while getting quickStats';
            console.error(message, err);
            return null

        }
    }

    public async saveToMd(cutAt:string, mdLocation?:string){
        try {
            Scaffolder.logProgress('saving tasks to markdown started...', 'working');
            const todoItems = await this.getTasksToDisplay() as string[];
            const sortedItems = TasksHandler.priorityTaskSort(todoItems);
            function mapCallback(item:string):string{
                const [,main] = item.split('>');
                const [todo,file] = main.split(fileDelim)
                const cutAtIndex = file.indexOf(cutAt);
                if(cutAtIndex === -1){
                    throw new Error('cutAt value is not contained within paths')
                }
                const modFile = file.substring(cutAtIndex).replaceAll('\\','/');
                return `+ ${todo} [${modFile}](${modFile})\n\n`
            }

            const highPCategory = sortedItems.highP.map(mapCallback).join('');
            const moderateCategory = sortedItems.moderateP.map(mapCallback).join('');
            const lowPCategory = sortedItems.lowP.map(mapCallback).join('');
            const locationToBeUsed = mdLocation !== undefined  ? mdLocation : this.markdownLocation;
            const mergedMd = `## ***HIGH PRIORITY***\n\n${highPCategory}## ***MODERATE PRIORITY***\n\n${moderateCategory}## ***LOW PRIORITY***\n\n${lowPCategory}`;
            await TasksHandler.writeOperations(locationToBeUsed,mergedMd,{stream:false});
            Scaffolder.logProgress('saving to markdown successful', 'success');
        }
        catch(err){
            const message = 'an error occurred while saving items to markdown';
            console.error(message, err);
        }

    }
}

export default TasksHandler;
