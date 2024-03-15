import {Command} from 'commander';
import CLIExecutor, {Project} from "./CLIExecutor.service.js";
import select, { Separator } from '@inquirer/select';
import rawlist from '@inquirer/rawlist';
import {input} from "@inquirer/prompts";

import * as path from "node:path";

class CLIInterface{
    private program :Command;
    private programVersion: string;
    private programDescription: string;
    private commandsExecutorClass:CLIExecutor;
    public projectName:string;
    public projectPath : string;

    constructor() {
        this.program = new Command();
        this.programVersion = '1.0.0';
        this.programDescription = 'interface for blitz_forge scaffolding tool and inline task manager';
        this.projectName = '';
        this.commandsExecutorClass = new CLIExecutor(this.projectName);
        this.projectPath = '';
    }
    public async configureCommands():Promise<void>{
        try{
            this.program
                .version(this.programVersion)
                .description(this.programDescription);
            await this.scaffoldInterface();
            await this.buildTree();
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
                .command('project')
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
                .argument('<contType>', 'specifies the type')
                .argument('<load...>', 'folders to create in src')
                .action(async (load,contType):Promise<void>=>{
                    console.log('started to create quick tree');
                    if(contType !== 'dir' && contType !== 'file'){
                        console.log('specified type is not allowed')
                    }
                    await this.commandsExecutorClass.quickTree(load,contType);
                })

        }
        catch(err){
        }
    }
    // commands and interface related to taskTracker
    public async taskTracker():Promise<void>{
        this.program
            .command('')

    }




}

export default CLIInterface;
