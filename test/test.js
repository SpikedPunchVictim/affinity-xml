'use strict';

var path = require('path'),
   chai = require('chai'),
   spies = require('chai-spies'),
   expect = chai.expect,
   affinity = require('affinity'),
   types = affinity.types,
   gxml = require('../index.js'),
   rimraf = require('rimraf').sync,
   Fill = affinity.test.fill;

chai.use(spies);

let testPath = path.join(__dirname, '__test');

function setup() {
   let proj = affinity.create();

   affinity.use(gxml);
   gxml.add(proj, testPath);
   return proj;
}

function teardown() {
   try {
      rimraf(testPath);
   } catch(ex) {
      // Ignore
   }

}

describe('Read <-> Write', function () {
   this.timeout(0);

   afterEach(function () {
      teardown();
   })

   it('Namespaces', function (done) {
      let proj = setup();

      let one = proj.root.children.new('one');
      let two = proj.root.children.new('two');
      let three = one.children.new('three');
      let four = three.children.new('four');

      proj.commit()
         .then(_ => {
            proj = setup();
            return proj.open();
         })
         .then(_ => {
            one = proj.root.children.findByName('one');
            two = proj.root.children.findByName('two');
            three = one.children.findByName('three');
            four = three.children.findByName('four');

            expect(one).not.to.be.null;
            expect(two).not.to.be.null;
            expect(three).not.to.be.null;
            expect(four).not.to.be.null;
            done();
         })
         .catch(err => {
            done(err);
         });
   });

   it('Models', function (done) {
      let proj = setup();

      let one = proj.root.children.new('one');
      let two = one.children.new('two');

      let model_one = one.models.new('model_one');
      let model_two = two.models.new('model_two');

      let oneInfo = Fill.model(model_one);
      let twoInfo = Fill.model(model_two);

      proj.commit()
         .then(_ => {
            proj = setup();
            return proj.open();
         })
         .then(_ => {
            one = proj.root.children.findByName('one');
            expect(one).not.to.be.null;

            two = one.children.findByName('two');
            expect(two).not.to.be.null;

            model_one = one.models.findByName('model_one');
            model_two = two.models.findByName('model_two');

            expect(one).not.to.be.null;
            expect(two).not.to.be.null;

            oneInfo.forEach(info => {
               let member = model_one.members.at(info.index);
               expect(member).not.to.be.null;
               expect(member.name).to.be.equal(info.name);
               expect(member.value.equals(info.value)).to.be.true;
            });

            twoInfo.forEach(info => {
               let member = model_two.members.at(info.index);
               expect(member).not.to.be.null;
               expect(member.name).to.be.equal(info.name);
               expect(member.value.equals(info.value)).to.be.true;
            });

            done();
         })
         .catch(err => {
            done(err);
         });
   });

   it('Instances', function (done) {
      let proj = setup();

      let one = proj.root.children.new('one');
      let two = one.children.new('two');

      let model_one = one.models.new('model_one');
      let model_two = two.models.new('model_two');

      let oneInfo = Fill.model(model_one);
      let twoInfo = Fill.model(model_two);

      one.instances.new('i_one', model_one);
      let i_two = two.instances.new('i_two', model_two);
      let field = i_two.fields.at(0);
      field.value.update(false)
         .then(_ => proj.commit())
         .then(_ => {
            proj = setup();
            return proj.open();
         })
         .then(_ => {
            one = proj.root.children.findByName('one');
            expect(one).not.to.be.null;

            two = one.children.findByName('two');
            expect(two).not.to.be.null;

            let i_one = one.instances.findByName('i_one');
            expect(i_one).not.to.be.null;

            let i_two = two.instances.findByName('i_two');
            expect(i_two).not.to.be.null;

            oneInfo.forEach(info => {
               let field = i_one.fields.at(info.index);
               expect(field).not.to.be.null;
               expect(field.name).to.be.equal(info.name);
               expect(field.value.equals(info.value)).to.be.true;
               expect(field.isInheriting).to.be.true;
            });

            twoInfo.forEach(info => {
               let field = i_two.fields.at(info.index);
               expect(field).not.to.be.null;
               expect(field.name).to.be.equal(info.name);

               if(info.index == 0) {
                  expect(field.value.equals(info.value)).to.be.false;
                  expect(field.isInheriting).to.be.false;
               } else {
                  expect(field.value.equals(info.value)).to.be.true;    
                  expect(field.isInheriting).to.be.true;
               }
            });

            done();
         })
         .catch(err => {
            done(err);
         });
   });
})