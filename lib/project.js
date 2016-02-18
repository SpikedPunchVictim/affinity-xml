'use strict';

var fs = require('fs');
var path = require('path');
var builder = require('xmlbuilder');
var Q = require('q');
var File = require('./file.js');

//------------------------------------------------------------------------
function writeTableOfContents(project, directory) {
    var defer = Q.defer();
    
    var root = builder.create('Project');
    var nspaces = root.ele('Namespaces');

    for(var nspace of project.namespaces) {
        nspaces.ele('Namespace', {QualifiedName: nspace.qualifiedName});
    }
    
    var models = root.ele('Models');
    for(var model of project.models) {
        models.ele('Model', {QualifiedName: model.qualifiedName});
    }
    
    var instances = root.ele('Instances');
    for(var instance of project.instances) {
        instances.ele('Instance', {QualifiedName: instance.qualifiedName});
    }
    
    var xmlString = root.end({ pretty: true, indent: '  ', newline: '\n' });
    fs.writeFile(path.join(directory, File.toc), xmlString, err => {
        if(err) {
            return defer.reject(new Error(err));
        }
        
        defer.resolve();
    });
    
    return defer.promise; 
}

//------------------------------------------------------------------------
function readTableOfContents(project) {
    
}

module.exports.writeTableOfContents = writeTableOfContents;