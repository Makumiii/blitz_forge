import * as fs from "fs";
import * as path from "node:path";

/*
->make changes to the method

*/


class taskTracker{
    public cwd:string;
    public commentSignatureRegex:RegExp;
    // public supportedFiles:string[];
    public store:string[];
    public bulletsSignatureRegex:RegExp;
    public codeBaseLocation:string;
    constructor(){
        this.cwd = process.cwd();
        this.commentSignatureRegex = /^(\/\*)((->).*)+(\*\/)$/;
        this.bulletsSignatureRegex = /^((->).*)+$/
        // this.supportedFiles = ['.ts', '.tsx', '.js', '.jsx'];
        this.store = [];
        this.codeBaseLocation = path.resolve(this.cwd, 'src');

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

    static async writeOperations(writePath:string,data:string, options?:{stream:boolean}):Promise<void | fs.WriteStream>{
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


    public async getTodos(entryLocation?:string):Promise<void>{
        try{

            const entryPointToUse = entryLocation === undefined ? this.codeBaseLocation : entryLocation;
            const srcContents = await fs.promises.readdir(entryPointToUse, {encoding:"utf-8"});

            for(const content of srcContents){
                const contentPath = path.resolve(entryPointToUse, content);
                const contentType = (await fs.promises.stat(contentPath)).isDirectory()
                if(await taskTracker.isSupportedFile(contentPath)){
                    const fileContent = await taskTracker.readOperations(contentPath, {stream:false}) as string;
                    const match:RegExpExecArray | null = this.commentSignatureRegex.exec(fileContent);
                    if(match !== null){
                        const matchString = match[0];
                        const todoItemsMatch:RegExpMatchArray | null = matchString.match(this.bulletsSignatureRegex)
                        if(todoItemsMatch !== null){
                            this.store.push(...todoItemsMatch);
                        }
                    }
                }else if((await fs.promises.stat(contentPath)).isDirectory()){
                    await this.getTodos(contentPath);
                }else{

                    throw new Error(`an unexpected exception occurred. Item is neither a dir or file or is corrupted: ${contentPath}`);
                }


            }

        }
        catch(err){
            const message = 'an error occurred while getting todos from src files';
            console.error(message, err);
        }
    };



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



}

export default taskTracker;
