'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var builder = require('xmlbuilder');
var when = require('when');
var values = require('./values.js');
var utils = require('./utils.js');

/*
 Example:
   <?xml version="1.0"?>
   <Model QualifiedName="model_one">
      <Members>
         <Member Name="int_mem">
            <Value>
               <Type Name="int"/>
               <Simple value="64"/>
            </Value>
         </Member>
         <Member Name="uint_mem">
            <Value>
               <Type Name="int"/>
               <Simple value="1024"/>
            </Value>
         </Member>
      </Members>
   </Model>
*/

//------------------------------------------------------------------------
/*
* Writes a model to its respective file.
*
* @param {string} projectDirectory The project's root firectory
* @param {Object} model The gaia Model to export
*/
//------------------------------------------------------------------------
function write(projectDirectory, model) {
   return when.try(() => {
      var root = builder.create('Model');
      root.att({QualifiedName: model.qualifiedName});
      var members = root.ele('Members');

      let opts = {
         includeTypeInfo: true
      };

      for(let member of model.members) {
         let node = members.ele('Member', {Name: member.name});
         values.write(node, member.value, opts);
      }

      return root.end({ pretty: true, indent: '  ', newline: '\n' });
   })
   .then(xmlString => {
	   let filePath = utils.modelToPath(projectDirectory, model);
      utils.mkdirs(path.dirname(filePath));
      return utils.writeFile(filePath, xmlString);
   });
}

/*
* Loads all Models from a project
*
* @param {string} projectDirectory The project's directory
* @param {Project} project The project structure containing the Model definitions
* @return {Promise} Promise reflecting the Model loading state
*/
function read(projectDirectory, project) {
   let promises = [];

   for(let model of project.models) {
      let filePath = utils.modelToPath(projectDirectory, model);

      let promise = utils.readFile(filePath, 'utf8')
         .then(xml => utils.parseXml(xml))
         .then(xml => {
            let qname = xml.Model.$.QualifiedName;
            let members = xml.Model.Members.length == 0 ?
                  null :
                  xml.Model.Members[0].Member;

            if(members == null) {
               // No members
               return;
            }           

            if(qname !== model.qualifiedName) {
               throw new Error('Stored Model QualifiedName does not match the project\'s table of contents');
            }

            for(let memberNode of members) {
               let name = memberNode.$.Name;
               let value = values.read(memberNode.Value[0]);
               model.members.new(name, value);
            }
         });

      promises.push(promise);
   }

   return when.all(promises);
}

/*
* List all model files that will be generated for this run
*/
function *listFiles(project, projectDirectory) {
   for(let model of project.models) {
      yield utils.modelToPath(projectDirectory, model);
   }
}

//------------------------------------------------------------------------
module.exports = {
   write: write,
   read: read,
   listFiles: listFiles
};