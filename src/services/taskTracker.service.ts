import * as fs from "fs";
import * as path from "node:path";
import * as EventEmitter from "node:events";
import {fileURLToPath} from "node:url";
import CLIExecutor from "./CLIExecutor.service.js";


interface StoreStructure{
    data:string[];
    lastModified:Date | null;
    created:Date | null;
}

/*
->make changes to the user balance regex
->add a method to follow other users
->refactor class properties
*/


class taskTracker{
    public cwd:string;
    public commentSignatureRegex:RegExp;
    // public supportedFiles:string[];
    public store:string[];
    public bulletsSignatureRegex:RegExp;
    public codeBaseLocation:string;
    readonly tasksPermanentStoreLocation:string;
    readonly storeTasksEvent:EventEmitter;

    constructor(){
        this.cwd = process.cwd();
        this.commentSignatureRegex =  /\/\*\s*((?:\n+->\s?\S?.*\s?)+)\s*\*\//gm;
        this.bulletsSignatureRegex = /->\s*\S*.*\n*/g;
        // this.supportedFiles = ['.ts', '.tsx', '.js', '.jsx'];
        this.store = [];
        this.codeBaseLocation = path.resolve(this.cwd, 'src');
        this.tasksPermanentStoreLocation = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..', '..', 'userData', 'taskTracker', 'tasks.data.json' );
        this.storeTasksEvent = new EventEmitter.EventEmitter().on('storeTasks',this.storeTasksHandler );


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

            const entryPointToUse = process.cwd();
            console.log('entry point to user, entryPointToUse');
            const files = await taskTracker.traverseDirTree(entryPointToUse,{result:true}) as string[];
            console.log('found files', files);
            for(const file of files){
                console.log(file);
                const fileContent = await taskTracker.readOperations(file, {stream:false}) as string;
                const commentMatchArray = fileContent.match(this.commentSignatureRegex) as RegExpMatchArray;
                if(commentMatchArray === null){
                    continue;
                }
                console.log('Comment match array', commentMatchArray)
                const todoItems = commentMatchArray[0].match(this.bulletsSignatureRegex) as RegExpMatchArray;
                console.log('todo items', todoItems)
                this.store.push(...todoItems);
            }


            this.storeTasksEvent.emit('storeTasks');
            CLIExecutor.logProgress('storing tasks done', 'success');
        }
        catch(err){
            const message = 'an error occurred while getting tasks from src files';
            console.error(message, err);
        }
    };
    private async storeTasksHandler():Promise<{success:boolean}>{

        try{


            const content = JSON.parse(await taskTracker.readOperations(this.tasksPermanentStoreLocation, {stream:false}) as string) as StoreStructure;
            content.data.push(...this.store);
            const initiallyCreated = content.created !== null;
            if(!initiallyCreated){
                content.created = new Date();
            }

            content.lastModified = new Date();

            await taskTracker.writeOperations(this.tasksPermanentStoreLocation, content, {stream:false});
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

    public async getTasksToDisplay():Promise<string[] | null>{
        try{
            CLIExecutor.logProgress('started getting tasks to display', 'working');
            const storeContent = await taskTracker.readOperations(this.tasksPermanentStoreLocation, {stream:false}) as string;
            const tasksArray = JSON.parse(storeContent) as StoreStructure;
            return tasksArray.data;
        }
        catch(err){
            const message = 'an error occurred while displaying tasks';
            console.error(message, err);
            return null;
        }
    };

    public async shakeTree():Promise<void>{
        try{
            CLIExecutor.logProgress('shaking Tree started', 'working')
            const targetLocation= process.cwd();
            const files =  await taskTracker.traverseDirTree(targetLocation,{result:true}) as string[];
            for (const file of files){
                const fileContent = await taskTracker.readOperations(file,{stream:false} ) as string;
                fileContent.replace(this.commentSignatureRegex, '');
                await taskTracker.writeOperations(file, fileContent, {stream:false});
            }
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
             console.log('path', treeLocation);
             const dirItems = await fs.promises.readdir(treeLocation, {encoding:"utf-8"});
             console.log('dirItems are', dirItems);
             for(const dirItem of dirItems){
                 console.log('dirItem', dirItem)
                 const dirItemPath = path.resolve(treeLocation, dirItem);
                 const isSupportedFile = await taskTracker.isSupportedFile(dirItemPath);
                 console.log('is supported file', isSupportedFile)
                 const isDir = (await fs.promises.stat(dirItemPath)).isDirectory()
                 if(isSupportedFile){
                     console.log('current Array', arraysToReturn)
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





}

export default taskTracker;
