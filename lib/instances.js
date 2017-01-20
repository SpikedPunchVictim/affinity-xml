'use strict';

var fs = require('fs'),
   path = require('path'),
   util = require('util'),
   builder = require('xmlbuilder'),
   when = require('when'),
   sequence = require('when/sequence'),
   values = require('./values'),
   utils = require('./utils'),
   qpath = require('affinity').qpath;

/*
 Example:

 <?xml version="1.0"?>
 <Instance QualifiedName="some.qualified.path">
   <Fields>
      <Field Name="Field1">
         <Field Name="int_mem">
            <Value>
               <Type Name="int"/>
               <Simple value="64"/>
            </Value>
         </Field>
      </Field>
   </Fields>
 </Instance>
*/

//------------------------------------------------------------------------
function write(projectDirectory, inst) {
   return when.try(() => {
      var root = builder.create('Instance');
      root.att({ QualifiedName: inst.qualifiedName, Model: inst.model.qualifiedName });
      var fields = root.ele('Fields');

      let opts = {
         includeTypeInfo: false
      };

      for(let field of inst.fields) {
         var node = fields.ele('Field', { Name: field.name, IsInheriting: field.isInheriting });
         values.write(node, field.value, opts);
      }

      return root.end({ pretty: true, indent: '  ', newline: '\n' });
   })
      .then(xmlString => {
         let filePath = utils.instToPath(projectDirectory, inst);
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

   for(let inst of project.instances) {
      let filePath = utils.instToPath(projectDirectory, inst);

      let promise = utils.readFile(filePath, 'utf8')
         .then(xml => utils.parseXml(xml))
         .then(xml => {
            let qname = xml.Instance.$.QualifiedName;
            let modelQname = xml.Instance.$.Model;
            let fields = xml.Instance.Fields.length == 0 ?
               null :
               xml.Instance.Fields[0].Field;

            if(fields == null) {
               // No fields
               return;
            }

            if(qname !== inst.qualifiedName) {
               throw new Error('Stored Instance QualifiedName does not match the project\'s table of contents');
            }

            let model = project.search.model.find(modelQname);

            // For when.sequence, we create an array of methods that return promises
            let fieldPromises = fields.map(node => () => {
               let name = node.$.Name;
               let member = model.members.findByName(qpath.basename(name));

               let value = values.read(node.Value[0], member.type);
               let field = inst.fields.findByName(name);
               return field.value.update(value);
            });

            return sequence(fieldPromises);
         });

      promises.push(promise);
   }

   return when.all(promises)
      .catch(err => {
         console.log(`Failed writing instances. Reason:\n${err.stack}`);
         throw err;
      });
}

/*
* List all instance files that will be generated for this run
*/
function* listFiles(project, projectDirectory) {
   for(let inst of project.instances) {
      yield utils.instToPath(projectDirectory, inst);
   }
}

//------------------------------------------------------------------------
module.exports = {
   write: write,
   read: read,
   listFiles: listFiles
};