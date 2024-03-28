## GETTING STARTED

## *Pre-requisites*

   * node v20.0.0 ⬆️


   * npm v10.0.0 ⬆️ 

## *up and running*

###### clone project

`https://github.com/Makumiii/blitz_forge.git`

###### install deps

`npm install`

###### build src

```npm run build```


###### link project

`npm link [projectName]`



## *usage* 

### scaffolding commands

###### guided initialization
 
   `blitz project --init` `-i`

###### quick initialization

`blitz project [projectName] [projectType]`

***project types are:***

+ react
+ webServer
+ node
+ cli

Custom projects can be defined in the ``` blitz.config.js ``` at root.

### build tree commands

`blitz tree item1 item2 item3 --file||--dir`

Load can only be of one type defined in the command options. Either a file or dir

### inline tasks usage

Inline tasks exist as a js comment with the following signature
```
/*
->foo
->bar
*/

```
marking tasks as done has the following signature

```
/*
->foo
-!>bar
*/

```
in the above code snippet `-!>bar` is done on the command `blitz tt --shakedone` `-sd` it will be removed resulting to:
```
/*
->foo
*/

```

#### *priority inline tasks*

``` 
/*
--->foo // low priority
----->bar //moderate priority
----------->devin //high priority
*/
```
On displaying inline tasks with priority, high priority tasks appear as `red` moderate as `blue` and low as `green`.




### Inline tasks commands

``` blitz tt --build ``` `-b` 

Traverses code base grabbing all inline tasks. Dependent on current working directory.

____

`blitz tt --shake` `-s`

Traverses code base removing all inline tasks. It is Also dependent on current working directory.

____

`blitz tt --shakedone` `-sd`

Traverses code base removing only inline tasks marked as done.

____

`blitz tt --get` `-g`

Gets tasks from json store and displays according to priority.

____

`blitz tt --remove` `-rm`

Clears json store and shakes tree too.

____

`blitz tt --quickstats` `-qs`

Gives brief overview of inline tasks status as json.

## Tips
- Build inline tasks from target directory for quicker build times ⚡

## known issues
Scaffolding react takes awfully long to scaffold.

## Todos

- Implement a nesting pattern when building tree for easy complex tree creation and automatic item detection to avoid `--file` or `--dir` flags.



- Build a comprehensive API for customization through `blitz.config.js` in root. 


-Add an embeddable db instead of using json, sql lite
