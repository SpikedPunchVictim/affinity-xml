'use strict';

var chai = require('chai');
var expect = chai.expect;
var gaia = require('gaia');
var types = gaia.types;

function buildProject() {
   let proj = gaia.create();

   var one = proj.root.children.new('one');
   var two = proj.root.children.new('two');
   var three = proj.root.children.new('three');

   var model = proj.root.models.new('model_one');
   model.members.new('int_mem', types.int.value(64));
   model.members.new('uint_mem', types.int.value(1024));
   model.members.new('bool_mem', types.bool.value(true));
   model.members.new('string_mem', types.string.value('some random string'));
   model.members.new('dec_mem', types.decimal.value(14.32));
   
   model.members.new('collection_int', types.collection.value(types.int.type()))
      .value.add(types.int.value(1))
      .add(types.int.value(2))
   	.add(types.int.value(3))
   	.add(types.int.value(4))
   	.add(types.int.value(5))
   	.add(types.int.value(6));

   var collectionOfStringCollections =types.collection.value(gaia.types.collection.type(gaia.types.string.type()));
   var collectionCollectionMem = model.members.new('collection_of_string_collections', collectionOfStringCollections);

   var instance = proj.root.instances.new('instance_one', model);
   instance.fields.get('int_mem').value = types.int.value(13);

   one.children.new('one_nspace_one');
   one.children.new('one_nspace_two');
   one.children.new('one_nspace_three');

   one.models.new('one_model_one');
   one.models.new('one_model_two');
   one.models.new('one_model_three');

   one.instances.new('one_instance_one', model);
   one.instances.new('one_instance_two', model);
   one.instances.new('one_instance_three', model);

   two.children.new('two_nspace_one');
   two.children.new('two_nspace_two');
   two.children.new('two_nspace_three');

   two.models.new('two_model_one');
   two.models.new('two_model_two');
   two.models.new('two_model_three');

   two.instances.new('two_instance_one', model);
   two.instances.new('two_instance_two', model);
   two.instances.new('two_instance_three', model);

   three.children.new('three_nspace_one');
   three.children.new('three_nspace_two');
   three.children.new('three_nspace_three');

   return proj;
}

function validateProject(project) {
   // 12 namespaces
   let count = 0;
   for(let nspace of project.namespaces) {
      count++;
   }

   // Validate namespaces
   expect(count).to.equal(12);
   expect(project.root.children.length).to.equal(3);

   let one = project.search.namespace.find('one');
   let two = project.search.namespace.find('two');
   let three = project.search.namespace.find('three');

   count = 0;
   for(let model of project.models) {
      count++;
   }

   expect(count).to.equal(7);

   count = 0;
   for(let model of project.instances) {
      count++;
   }
}

describe('validate', () => {
   it('should have built the project properly', () => {
      validateProject(buildProject());
   });   
})