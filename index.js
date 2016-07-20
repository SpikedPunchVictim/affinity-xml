


/*
var gaia = require('gaia');
var gxml = require('gaia-xml');

gaia.use(gxml);

gxml.add(project, directory);
gxml remove(project);


let proj = gxml.load('/some/path/to/project');


*/
'use strict';
//------------------------------------------------------------------------
var xml = require('xml2js');
var fs = require('fs');
var util = require('util');
var path = require('path');
var when = require('when');
var walk = require('walk');
var proj = require('./lib/project.js');
var models = require('./lib/model.js');
var instances = require('./lib/instances.js');
var File = require('./lib/file.js');
var values = require('./lib/values.js')

var Events = {};
var ProjectDirectoryMap = new Map();
var gaia = null;

/*
* Loads a project from the specified path
*/
function load(path) {

}

//------------------------------------------------------------------------
function add(project, directory) {
    var cached = ProjectDirectoryMap.get(project);
    
    if(!cached && gaia) {
        registerProject(project);        
    }
    
    ProjectDirectoryMap.set(project, {
        directory: path.resolve(directory),
        registered: gaia != null
    });
}

//------------------------------------------------------------------------
function remove(project) {
    unregisterProject(project);
    ProjectDirectoryMap.delete(project);
}

//------------------------------------------------------------------------
function register(g) {
    gaia = g;
    Events = g.Events;

    // Init the values module
    values.init({ gaia: g });
    
    ProjectDirectoryMap.forEach((value, key) => {
       if(!value.registered) {
           registerProject(value.project);
           value.registered = true;
       }
    });
}

//------------------------------------------------------------------------
function registerProject(project) {
    project.on(Events.project.openRequest, open);
    project.on(Events.project.commitRequest, commit);  
}

//------------------------------------------------------------------------
function unregisterProject(project) {
    project.off(Events.project.openRequest, open);
    project.off(Events.project.commitRequest, commit);
}

//------------------------------------------------------------------------
function open(req) {
    var project = req.context.project;
    var projectDirectory = ProjectDirectoryMap.get(project);
    
    if(!projectDirectory) {
        throw new Error('No filepath is associated with Project: %j', project);
    }
    
    req.await((context, promise) => {
        onOpen(project, promise);
    });
}

//------------------------------------------------------------------------
function commit(req) {
    var project = req.context.project;
    var filepath = ProjectDirectoryMap.get(project);
    
    if(!filepath) {
        throw new Error('No filepath is associated with Project: %j', project);
    }
    
    req.await((context, promise) => {
        onCommit(project, promise);
    });
}

//------------------------------------------------------------------------
function onCommit(project, promise) {
    let cached = ProjectDirectoryMap.get(project);
    let directory = cached.directory;

    return when.try(() => {
        try {
            fs.mkdirSync(directory);
        } catch(ex) {
            if(ex.code != 'EEXIST') {
            throw new Error(util.format('Failed to create the directory %s when commiting the project.')); 
            }
        }

        return getFilesToDelete(directory, project);
    })
    .then(filesToDelete => {       

        // On a commit we:
        //  1) Generate a list of files that already exist
        //  1) Write out the project's table of contents
        //  2) Write out all Models
        //  3) Write out all instances
        
        let promises = [];

        let tocPromise = proj.write(directory, project);

        promises.push(tocPromise);
        
        for(let model of project.models) {
            promises.push(models.write(directory, model));
        }

        for(let inst of project.instances) {
            promises.push(instances.write(directory, inst));
        }

        return when.all(promises)
            .then(() => {
                filesToDelete.forEach(filePath => {
                    fs.unlinkSync(filePath);
                });
            });
    })
    .then(() => promise.done())
	.catch(err => promise.reject(err));
}

//------------------------------------------------------------------------
/*
*
*/
//------------------------------------------------------------------------
function onOpen(project, promise) {
    let cached = ProjectDirectoryMap.get(project);
    let directory = cached.directory;

    return  proj.read(directory, project)
        .then(_ => models.read(directory, project))
        .then(_ => instances.read(directory, project))
        .catch(err => {
            console.error(`Failed to read project at ${directory}.\nReason: ${err}` );
        });
}

/*
* Returns a list of files that should be removed when commiting
*/
function getFilesToDelete(projectDirectory, project) {
    return when.try(() => {
        let current = [];
        let walker = walk.walk(projectDirectory);
        let defer = when.defer();

        walker.on('files', (root, stat, next) => {
            current.push(path.resolve(root, stat.name));
            next();
        });

        walker.on('errors', (root, stats, next) => {
            // TODO: Improve messaging
            defer.reject('Failed to generate a list of existing files');
        });

        walker.on('end', () => {
            defer.resolve();
        });

        return defer.promise;
    })
    .then(currentFiles => {
        let filesToDelete = new Set(currentFiles);
        
        for(let file of proj.listFiles(project, projectDirectory)) {
            filesToDelete.delete(file);
        }

        for(let file of models.listFiles(project, projectDirectory)) {
            filesToDelete.delete(file);
        }

        for(let file of instances.listFiles(project, projectDirectory)) {
            filesToDelete.delete(file);
        }

        return filesToDelete;
    });
}

module.exports = {
    load: load,
    add: add,
    remove: remove,
    register
};