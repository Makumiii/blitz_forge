import * as fs from "fs";
import * as path from "node:path";
import * as EventEmitter from "node:events";

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
        this.commentSignatureRegex = /^(\/\*)(\s)?((->)\s?\S*)+\2?(\*\/)$/gm;
        this.bulletsSignatureRegex = /^((->)\s?\S*)$/gm
        // this.supportedFiles = ['.ts', '.tsx', '.js', '.jsx'];
        this.store = [];
        this.codeBaseLocation = path.resolve(this.cwd, 'src');
        this.tasksPermanentStoreLocation = path.resolve(__dirname,'..', '..', 'userData', 'taskTracker', 'tasks.data.json' );
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


    public async searchTasksInCB(entryLocation?:string):Promise<void>{
        try{

            const entryPointToUse = entryLocation === undefined ? this.codeBaseLocation : entryLocation;
            const srcContents = await fs.promises.readdir(entryPointToUse, {encoding:"utf-8"});

            for(const content of srcContents){
                const contentPath = path.resolve(entryPointToUse, content);
                const contentType = (await fs.promises.stat(contentPath)).isDirectory()
                if(await taskTracker.isSupportedFile(contentPath)){
                    const fileContent = await taskTracker.readOperations(contentPath, {stream:false}) as string;
                    const firstFoundMatch:RegExpExecArray | null = this.commentSignatureRegex.exec(fileContent);
                    if(firstFoundMatch !== null){
                        const matchString = firstFoundMatch[0];
                        const todoItemsMatch:RegExpMatchArray | null = matchString.match(this.bulletsSignatureRegex)
                        if(todoItemsMatch !== null){
                            this.store.push(...todoItemsMatch);
                        }
                    }
                }else if((await fs.promises.stat(contentPath)).isDirectory()){
                    await this.searchTasksInCB(contentPath);
                }else{

                    throw new Error(`an unexpected exception occurred. Item is neither a dir or file or is corrupted: ${contentPath}`);
                }


            }
            this.storeTasksEvent.emit('storeTasks');
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

    private async getTasksToDisplay():Promise<string[] | null>{
        try{
            const storeContent = await taskTracker.readOperations(this.tasksPermanentStoreLocation, {stream:false}) as string;
            const tasksArray = JSON.parse(storeContent) as StoreStructure;
            return tasksArray.data;
        }
        catch(err){
            const message = 'an error occurred while displaying tasks';
            console.error(message, err);
            return null;
        }
    }



}

export default taskTracker;
