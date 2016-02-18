


/*
var gaia = require('gaia');
var gxml = require('gaia-xml');

gaia.use(gxml);

gxml.add(project, directory);
gxml remove(project);



*/
'use strict';
//------------------------------------------------------------------------
var xml = require('xml2js');
var builder = require('xmlbuilder');
var fs = require('fs');
var util = require('util');
var path = require('path');
var Q = require('q');
var proj = require('./lib/project.js');
var models = require('./lib/model.js');
var File = require('./lib/file.js');

var Events = {};
var ProjectDirectoryMap = new Map();
var gaia = null;

//------------------------------------------------------------------------
module.exports.add = function add(project, directory) {
    var cached = ProjectDirectoryMap.get(project);
    
    if(!cached && gaia) {
        registerProject(project);        
    }
    
    ProjectDirectoryMap.set(project, {
        directory: directory,
        registered: gaia != null
    });
}

//------------------------------------------------------------------------
module.exports.remove = function remove(project) {
    unregisterProject(project);
    ProjectDirectoryMap.delete(project);
}

//------------------------------------------------------------------------
module.exports.register = function register(g) {
    gaia = g;
    Events = g.Events;
    
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
    
}

//------------------------------------------------------------------------
function commit(req) {
    var project = req.context.project;
    var filepath = ProjectDirectoryMap.get(project);
    
    if(!filepath) {
        throw new Error('No filepath is associated with Project: %j', project);
    }
    
    req.await((context, promise) => {
        saveProject(project, promise);
    });
}

//------------------------------------------------------------------------
function saveProject(project, promise) {
    var cached = ProjectDirectoryMap.get(project);
    var directory = cached.directory;

    try {
        fs.mkdirSync(directory);
    } catch(ex) {
        if(ex.code != 'EEXIST') {
           throw new Error(util.format('Failed to create the directory %s when commiting the project.')); 
        }
    }
    
    // Write the table of contents
    // var filesToWrite = generateFileList(project, directory);
    // filesToWrite.forEach(file => {
    //    console.log(file); 
    // });
    
    proj.writeTableOfContents(project, directory);
    
    for(let model of project.models) {
        models.write(directory, model);
    }
}

//------------------------------------------------------------------------
function generateFileList(project, directory) {
    var results = [path.join(directory, File.toc)];
    
    var appendedPath = path.join(directory, File.data);
    
    for(let model of project.models) {
        let tokens = model.qualifiedName.split('.');
        tokens.splice(0, 0, appendedPath);        
        tokens[tokens.length - 1] = 'model-' + tokens[tokens.length - 1];
        results.push(path.join.apply(path, tokens) + '.xml')
    }
    
    for(let instance of project.instances) {
        let tokens = instance.qualifiedName.split('.');
        tokens.splice(0, 0, appendedPath);  
        tokens[tokens.length - 1] = 'instance-' + tokens[tokens.length - 1];
        results.push(path.join.apply(path, tokens) + '.xml')
    }
    
    return results;
}

//------------------------------------------------------------------------
function writeModel(model, filepath) {
    var root = builder.create('Model', { QualifiedName: model.qualifiedName });
    var members = root.ele('Members');
    
    for(let member of model.members) {
        var node = members.ele('Member', { Name: member.name })
        .type(member.type)
        .value(member.value)
        
    }
    
    var xmlString = root.end({ pretty: true, indent: '  ', newline: '\n' });
    fs.writeFileSync(filepath, xmlString);  
}

function writeType(node, type) {
    node.ele('Type', { Name: type.name });
}