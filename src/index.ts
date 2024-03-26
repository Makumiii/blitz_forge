#!/usr/bin/env node


import cmd from "./services/cmd.service.js";
await new cmd().configureCommands();
