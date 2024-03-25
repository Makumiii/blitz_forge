import chalk, {ForegroundColorName} from "chalk";



class ProcessTimer{
    public cwd : string;
    public elapsedTime : number;
    public timeNow : Date;
    public timeOut : number  // to indicate minutes


    constructor() {
        this.cwd = process.cwd();
        this.elapsedTime = 0;
        this.timeNow = new Date();
        process.on('beforeExit',()=>{this.displayElapsedTime()} );
        this.terminateProcess();
        this.timeOut = 3

    }

    public StopTimer(){
        const currentTimeNow = new Date();
        this.elapsedTime = currentTimeNow.getTime() - this.timeNow.getTime() ;

    }
    public displayElapsedTime():void{
        this.StopTimer();
        const logColour :ForegroundColorName = 'magentaBright'
        console.log(chalk[logColour]('done in',this.elapsedTime / 1000, 's'));
    }
    public terminateProcess():void{

        const timeInMs : number = (():number=>{
            return this.timeOut * 60 * 100
        })();
        const logColour:ForegroundColorName = 'redBright'
        setTimeout(()=>{
            console.log(chalk[logColour]('task killed for exceeding timeout'));
            process.exit(1);

        },timeInMs)
    }





}
export default ProcessTimer;
