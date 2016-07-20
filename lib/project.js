'use strict';

var fs = require('fs');
var path = require('path');
var builder = require('xmlbuilder');
var when = require('when');
var qpath = require('gaia').qpath;
var File = require('./file.js');
var utils = require('./utils.js');

/*
Example table of contents:

<?xml version="1.0"?>
<Project>
  <Namespaces>
    <Namespace QualifiedName="one"/>
    <Namespace QualifiedName="two"/>
    <Namespace QualifiedName="three"/>
    <Namespace QualifiedName="one.one_nspace_one"/>
    <Namespace QualifiedName="one.one_nspace_two"/>
    <Namespace QualifiedName="two.two_nspace_three"/>
    <Namespace QualifiedName="three.three_nspace_one"/>
  </Namespaces>
  <Models>
    <Model QualifiedName="model_one"/>
    <Model QualifiedName="one.one_model_one"/>
    <Model QualifiedName="one.one_model_two"/>
    <Model QualifiedName="one.one_model_three"/>
    <Model QualifiedName="two.two_model_one"/>
    <Model QualifiedName="two.two_model_two"/>
    <Model QualifiedName="two.two_model_three"/>
  </Models>
  <Instances>
    <Instance QualifiedName="instance_one" Model="model_one"/>
    <Instance QualifiedName="one.one_instance_one" Model="model_one"/>
    <Instance QualifiedName="one.one_instance_two" Model="model_one"/>
  </Instances>
</Project>
*/


//------------------------------------------------------------------------
function write(projectDirectory, project) {
   return when.try(() => {
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
         instances.ele('Instance', {QualifiedName: instance.qualifiedName, Model: instance.model.qualifiedName});
      }

      return root.end({ pretty: true, indent: '  ', newline: '\n' });
   })
   .then(xmlString => {
      utils.writeFile(path.join(projectDirectory, File.toc), xmlString)
   });
}

//------------------------------------------------------------------------
function read(projectDirectory, project) {
   let tocFilePath = path.join(projectDirectory, File.toc);
   return utils.readFile(tocFilePath, 'utf8')
      .then(toc => utils.parseXml(toc))
      .then(toc => {
         // Build out top level objects from the table of contents
         let nspaces = toc.Project.Namespaces[0].Namespace;
         let models = toc.Project.Models[0].Model;
         let instances = toc.Project.Instances[0].Instance;

         for(let nspace of nspaces) {
            project.root.expand(nspace.$.QualifiedName);
         }

         for(let model of models) {
            let nspace = project.search.namespace.find(qpath.parent(model.$.QualifiedName));
            nspace.models.new(qpath.basename(model.$.QualifiedName));
         }

         for(let inst of instances) {
            let nspace = project.search.namespace.find(qpath.parent(inst.$.QualifiedName));
            let model = project.search.model.find(inst.$.Model);
            nspace.instances.new(qpath.basename(inst.$.QualifiedName), model);
         }

         console.dir(project);
      })
      .catch(err => {
         console.log('Failed reading toc: ', err);
      });



   // return when.try(() => {
   //    return utils.readFile(tocFilePath, 'utf8')
   //       .then((err, toc) => {
   //          console.log('Afer Read File');
   //          return utils.parseString(toc);
   //       })
   //       .then(toc => {
   //          console.log('wha');
   //          console.dir(toc);
   //       })
   //       .catch(err => {
   //          console.log('shit failed: ', err);
   //       });
   // });
}

function *listFiles(project, projectDirectory) {
   yield path.join(projectDirectory, File.toc);
}


//------------------------------------------------------------------------
module.exports = {
   write: write,
   read: read,
   listFiles: listFiles
};