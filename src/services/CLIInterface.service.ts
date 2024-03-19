import {Command} from 'commander';
import CLIExecutor, {Project} from "./CLIExecutor.service.js";
import select, { Separator } from '@inquirer/select';
import rawlist from '@inquirer/rawlist';
import {input} from "@inquirer/prompts";
import taskTracker from "./taskTracker.service.js";
/*
-------> Implement drag and drop functionality
---> Add form validation for user input
-> Fix responsive design issues
-> Update font styles
-> Add support for multiple languages
--------> Implement file upload feature
-> Add search functionality
---> Fix bug in user registration process
-> Optimize database queries
-> Refactor code for better readability
*/




class CLIInterface{
    private program :Command;
    private programVersion: string;
    private programDescription: string;
    private commandsExecutorClass:CLIExecutor;
    private taskTrackerClass:taskTracker;
    public projectName:string;
    public projectPath : string;

    constructor() {
        this.program = new Command();
        this.programVersion = '1.0.0';
        this.programDescription = 'interface for blitz_forge scaffolding tool and inline task manager';
        this.projectName = '';
        this.commandsExecutorClass = new CLIExecutor(this.projectName);
        this.projectPath = '';
        this.taskTrackerClass = new taskTracker();
    }
    public async configureCommands():Promise<void>{
        try{
            console.log('started configuring commands')
            this.program
                .version(this.programVersion)
                .description(this.programDescription);
            await this.scaffoldInterface();
            await this.buildTree();
            await this.taskTracker();
            this.program.parse(process.argv);

        }
        catch(err){
            const message = 'an error occurred while configuring commands';
            console.error(message, err);
        }

    }

    public async scaffoldInterface():Promise<void>{

        try{
            this.program
                .command('proj')
                .argument('[projectName]', 'name of the project being created')
                .argument('[projectType]', 'name of the type of project that the user intends to scaffold')
                .option('-i, --init', 'initialize with a guided setup')
                .action(async (projectName, projectType, options):Promise<void>=>{
                    this.projectName = projectName;
                    if(options.init){
                        // first step: get project name
                        const userInputProjectName = await input({
                            message:'enter the name of your project',
                        });

                        // second step: select project to scaffold
                        const userChosenProject = await rawlist({
                            message:'select a project type that you wish to scaffold',
                            choices:[
                                {name:'cli', value:'cli'},
                                {name:'react', value:'react'},
                                {name:'node', value:'node'},
                                {name:'web server', value:'webserver'}
                            ]
                        });
                        await this.commandsExecutorClass.buildProject(userChosenProject as Project, userInputProjectName);
                        return;


                    }
                    await this.commandsExecutorClass.buildProject(projectType, projectName);

                })

        }
        catch(err){
            const message = 'an error occurred while processing scaffolding interface';
            console.error(message, err);
            return;
        }
    }

    public async buildTree():Promise<void>{
        try{
            this.program
                .command('arch')
                .argument('<load...>', 'folders to create in src')
                .option('-f, --file', 'specifies file type')
                .option('-d, --dir', 'specifies directory type')
                .action(async (load,options):Promise<void>=>{
                    if(options.file !== true && options.dir !== true){
                        console.log('type flag was not specified');
                        return;
                    }
                    const fileType = options.file ? 'file' : 'dir';

                    await this.commandsExecutorClass.quickTree(load,fileType);
                })

        }
        catch(err){
        }
    }
    // commands and interface related to taskTracker
    public async taskTracker():Promise<void>{
        this.program
            .command('tt')
            .option('-b --build', 'build tasks from code base')
            .option('-s --shake', 'shake tree to remove all todo in given cwd')
            .option('-g --get', 'get tasks in store')
            .option('-rm --remove', 'remove tasks from store')
            .action(async(options)=>{
                if(options.build){
                    await this.taskTrackerClass.searchTasksInCB();
                    await this.taskTrackerClass.getTasksToDisplay({display:true});

                    return

                }
                if(options.shake){
                    await this.taskTrackerClass.shakeTree();
                    return;
                }
                if(options.get){
                    await this.taskTrackerClass.getTasksToDisplay({display:true}) ;
                    return
                }
                if(options.remove){
                    await this.taskTrackerClass.deleteTasksFromStore();
                    return
                }
                console.log('option not specified or invalid');

            })

    }




}

export default CLIInterface;
