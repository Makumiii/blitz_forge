import * as fs from "fs";


class taskTracker{
    public cwd:string;
    public todoRegex:RegExp;
    public supportedFiles:string[];
    constructor(){
        this.cwd = process.cwd();
        this.todoRegex = /^([/*])([->].*)+\1$/;
        this.supportedFiles = ['.ts', '.tsx', '.js', '.jsx'];
    }

    public async readOperations(pathToFile:string, option?:{stream:boolean}):Promise<string | null | fs.ReadStream>{
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

    public async writeOperations(path:string,data:string, options?:{stream:boolean}):Promise<void | fs.WriteStream>{
        try{
            const streamable = options?.stream === true;
            if(!streamable){
                await fs.promises.writeFile(path,  data, {encoding:"utf-8"});
                return;
            }
            return fs.createWriteStream(path,{encoding:"utf-8"});


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



}

export default taskTracker;
