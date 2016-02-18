'use strict';
var fs = require('fs');
var path = require('path');
var util = require('util');
var builder = require('xmlbuilder');
var Q = require('q');
var values = require('./values.js');

function getFilePath(projectDirectory, model) {
    var tokens = model.qualifiedName.split('.');
    tokens.splice(0, 0, projectDirectory);    
    return path.join.apply(path, tokens) + '.xml';
}

function write(projectDirectory, model) {
    console.log('writing model ', model.qualifiedName)
    var root = builder.create('Model');
    root.att({QualifiedName: model.qualifiedName});
    var members = root.ele('Members');
    
    for(let member of model.members) {
        console.log('\n\nMember Name: ', member.name);
        var innerMember = members.ele('Member', {Name: member.name});
        values.write(innerMember, member.value, true);
    }
    
    var filePath = getFilePath(projectDirectory, model);
    
    try {
        fs.mkdirSync(path.dirname(filePath));
    } catch(ex) {
        // Ignore
    }
    
    var xmlString = root.end({ pretty: true, indent: '  ', newline: '\n' });
    fs.writeFileSync(filePath, xmlString);
}

function writeFile(projectDirectory, model, xml) {    
    var tokens = model.qualifiedName.split('.');
    tokens.splice(0, 0, projectDirectory);
    
    var filePath = path.join.apply(path, tokens) + '.xml';
    
    console.log('filePath: ', filePath);
    console.log('xml: ', xml);
    
    try {
        return Q.all([
            Q.nfcall(fs.mkdir, path.dirname(filePath)),
            Q.nfcall(fs.writeFile, filePath, xml)
        ]);
    } catch(ex) {
        if(ex.code != 'EEXIST') {
           throw new Error(util.format('Failed to create the directory %s when commiting the project.')); 
        }
    }
}

module.exports.write = write;