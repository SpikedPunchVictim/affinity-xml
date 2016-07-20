'use strict';

var when = require('when');
var nodefn = require('when/node');
var fs = require('fs');
var path = require('path');
var parseXml = require('xml2js').parseString;

/*
* Generates the file path for a qualified object.
*
* @param {string} projectDirectory The project's root direcotry
* @param {Object} qualifiedObject  QualifiedObject from gaia
* @param {string} prependedId (optional) The string prepended to the file name
* @return {string} The path the Qualified Object 
*/
function getQualifiedPath(projectDirectory, qualifiedObject, prependedId) {
   prependedId = prependedId || '';
	var tokens = qualifiedObject.qualifiedName.split('.');
   tokens.splice(0, 0, projectDirectory);
   tokens[tokens.length - 1] = prependedId + tokens[tokens.length - 1];
   return path.join.apply(path, tokens) + '.xml';
}

/*
* Safely make all of the directories for a given path.
*
* @param {string} path The file path
*/
function mkdirs(path) {
   try {
      fs.mkdirSync(path);
   } catch(ex) {
      // Ignore
   }
}

function modelToPath(projectDirectory, model) {
   return getQualifiedPath(projectDirectory, model, 'm-');
}

function instToPath(projectDirectory, inst) {
   return getQualifiedPath(projectDirectory, inst, 'i-');
}

module.exports = {
   writeFile: nodefn.lift(fs.writeFile),
   readFile: nodefn.lift(fs.readFile),
   parseXml: nodefn.lift(parseXml),
   getQualifiedPath: getQualifiedPath,
   modelToPath: modelToPath,
   instToPath: instToPath,
   mkdirs: mkdirs
}