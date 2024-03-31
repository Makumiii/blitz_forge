import chalk, {ForegroundColorName} from "chalk";
import EventEmitter from 'events';
const timeOutTime = 2;






class ProcessTimer{
    public elapsedTime : number;
    public timeNow : Date;
    public timer :NodeJS.Timeout | undefined;
    public doneEmitter:EventEmitter;
    public timeInMs : number
    public logColour : ForegroundColorName;


    constructor() {
        this.elapsedTime = 0;
        this.timeNow = new Date();
        this.timeInMs = (():number=>{
            return timeOutTime * 60 * 1000
        })();
        this.logColour = 'redBright';
        this.timer = setTimeout(()=>{
            console.log(chalk[this.logColour]('task killed for exceeding timeout'));
            process.exit(1);

        },this.timeInMs);
        this.doneEmitter = new EventEmitter()
        this.doneEmitter.on('done',()=>{
            this.displayElapsedTime();
        } )

    }

    public StopTimer(){
        const currentTimeNow = new Date();
        this.elapsedTime = currentTimeNow.getTime() - this.timeNow.getTime() ;

    }
    public displayElapsedTime():void{
        this.StopTimer();
        const logColour :ForegroundColorName = 'magentaBright';
        console.log(chalk[logColour]('done in',this.elapsedTime / 1000, 's'));
        process.exit(0);
    }

    public done():void{
        clearTimeout(this.timer)
        this.doneEmitter.emit('done');
    }
}
export default ProcessTimer;
