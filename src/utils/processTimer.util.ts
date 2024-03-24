import chalk, {ForegroundColorName} from "chalk";


class ProcessTimer{
    public cwd : string;
    public elapsedTime : number;
    public timeNow : Date;


    constructor() {
        this.cwd = process.cwd();
        this.elapsedTime = 0;
        this.timeNow = new Date();
        process.on('exit',()=>{this.displayElapsedTime()} );
    }

    public StopTimer(){
        const currentTimeNow = new Date();
        this.elapsedTime = currentTimeNow.getTime() - this.timeNow.getTime() ;

    }
    public displayElapsedTime():void{
        this.StopTimer();
        const logColour :ForegroundColorName = 'magentaBright'
        console.log(chalk[logColour](this.elapsedTime / 1000, 'seconds'));
    }





}
export default ProcessTimer;
