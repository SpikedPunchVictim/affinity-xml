'use strict';
var gaia = require('../gaia');
var types = gaia.types;
var gxml = require('./index.js');

gaia.use(gxml);

let loadTesting = true;

var project = gaia.create();
gxml.add(project, './__test');

if(loadTesting) {
   return project.open();
} else {
   require('rimraf').sync('./__test');

   var one = project.root.children.new('one');
   var two = project.root.children.new('two');
   var three = project.root.children.new('three');
   var four = project.root.children.new('four');

   var model = project.root.models.new('model_one');
   model.members.new('int_mem', gaia.types.int.create(64));
   model.members.new('uint_mem', gaia.types.int.create(1024));
   model.members.new('bool_mem', gaia.types.bool.create(true));
   model.members.new('string_mem', gaia.types.string.create('some random string'));
   model.members.new('dec_mem', gaia.types.decimal.create(14.32));
   var intCollectionMem = model.members.new('collection_int', types.collection.create(types.int.type()));
   intCollectionMem.value.add(types.int.create(1));
   intCollectionMem.value.add(types.int.create(2));
   intCollectionMem.value.add(types.int.create(3));
   intCollectionMem.value.add(types.int.create(4));
   intCollectionMem.value.add(types.int.create(5));
   intCollectionMem.value.add(types.int.create(6));

   console.log('Collection Member: %j (%s)', intCollectionMem.value, intCollectionMem.value.length);
   // for(let value of intCollectionMem.value) {
   //     console.log(value);
   // }


   var collectionOfStringCollections = gaia.types.collection.create(gaia.types.collection.type(gaia.types.string.type()));
   var collectionCollectionMem = model.members.new('collection_of_string_collections', collectionOfStringCollections);

   var instance = project.root.instances.new('instance_one', model);
   let gg = instance.fields.at(0);
   gg.value = types.int.create(13);

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

   project.commit();
}


