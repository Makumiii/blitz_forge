#!/usr/bin/env node

import CLIExecutor from "./services/CLIExecutor.service";
const executor = new CLIExecutor('TEST_PROJECT');

(async function makeProject(){
    await executor.buildProjectFolder();
})();
