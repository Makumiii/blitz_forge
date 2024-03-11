#!/usr/bin/env node

import CLIInterface from "./services/CLIInterface.service.js";
(async function startInterface(){
    console.log('application started running successfully');
    await new CLIInterface().configureCommands();
})();
