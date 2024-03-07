import * as fs from "fs";
import * as path from "node:path";


class taskTracker{
    public cwd:string;
    public commentSignatureRegex:RegExp;
    public supportedFiles:string[];
    public store:string[];
    public bulletsSignatureRegex:RegExp
    constructor(){
        this.cwd = process.cwd();
        this.commentSignatureRegex = /^(\/\*)((->).*)+(\*\/)$/;
        this.bulletsSignatureRegex = /^((->).*)+$/
        this.supportedFiles = ['.ts', '.tsx', '.js', '.jsx'];
        this.store = [];

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

    public async writeOperations(writePath:string,data:string, options?:{stream:boolean}):Promise<void | fs.WriteStream>{
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
    public async getTodos(projectRootPath:string):Promise<void>{
        try{
            const srcPath = path.resolve(projectRootPath, 'src');
            const srcContents = await fs.promises.readdir(srcPath, {encoding:"utf-8"});

            for(const content of srcContents){
                const contentPath = path.resolve(srcPath, content);
                const contentType = (await fs.promises.stat(contentPath)).isDirectory()
                if(await new taskTracker().isSupportedFile(contentPath)){
                    const fileContent = await taskTracker.readOperations(contentPath, {stream:false}) as string;
                    const match = this.commentSignatureRegex.exec(fileContent);
                    if(match !== null){
                        const matchString = match[0];
                    }



                }


            }

        }
        catch(err){
            const message = 'an error occurred while getting todos from src files';
            console.error(message, err);
        }
    }

    private async isSupportedFile(filePath:string):Promise<boolean>{
        try{
            const file = await fs.promises.stat(filePath);
            const isFile = file.isFile();
            const extName = path.extname(filePath);
            return this.supportedFiles.includes(extName) && isFile;

        }
        catch(err){
            const message = 'an error occurred while checking if file is a supported file';
            console.error(message, err);
            return false

        }

    }



}

export default taskTracker;
