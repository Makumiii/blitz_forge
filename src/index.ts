#!/usr/bin/env node


import CLIInterface from "./services/CLIInterface.service.js";
await new CLIInterface().configureCommands();
