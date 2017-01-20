'use strict';

var when = require('when');
var parseString = require('xml2js').parseString;
var types = require('./types.js');

parseString = when.lift(parseString);

var affinity = null;

/*
 Writes the XML Value wrapper, with the optional Type header

 Header:
 <Value></Value>
*/
function writeValueWrap(node, value, opts) {
   var top = node.ele('Value');

   if (opts.includeTypeInfo) {
      types.write(top, value.type);
   }

   return top;
}

// function readValueWrap(node) {
//    return parseString(node);
// }

// function writeSimple(node, value) {
//    return node.ele('Simple', { Value: value.value });
// }

/*
* Writes a primitive value as xml
*
* @param {Node} node The XML node before the Value node
* @param {Value} value The Value
*/
function writePrimitive(node, value, options) {
   let valueNode = node.ele('Value');

   if(options.includeTypeInfo) {
	   valueNode.att('Type', value.type.name);
	}
   
   valueNode.att('Value', value.value);
   return valueNode;
}

function readPrimitive(node, onCreate) {
   let value = node.$.Value;
   return onCreate(value);
}

/*

Example:
<Value>
	<Type Name="int"/>
	<Simple value="1024"/>
</Value>

*/
// function readSimple(node, onCreate) {
//    let value = node.Simple[0].$.value;
//    return onCreate(value);
// }

var ValueMap = new Map();


/*
<Value Type="bool" Simple="true" />
*/

ValueMap.set('bool', {
   write: (node, value, options) => writePrimitive(node, value, options),
   read: (node, type) => readPrimitive(node, value => affinity.types.bool.value(value))
});

ValueMap.set('decimal', {
   write: (node, value, options) => writePrimitive(node, value, options),
   read: (node, type) => readPrimitive(node, value => affinity.types.decimal.value(value))
});

ValueMap.set('int', {
   write: (node, value, options) => writePrimitive(node, value, options),
   read: (node, type) => readPrimitive(node, value => affinity.types.int.value(value))
});

ValueMap.set('string', {
   write: (node, value, options) => writePrimitive(node, value, options),
   read: (node, type) => readPrimitive(node, value => affinity.types.string.value(value))
});

ValueMap.set('uint', {
   write: (node, value, options) => writePrimitive(node, value, options),
   read: (node, type) => readPrimitive(node, value => affinity.types.uint.value(value))
});

/*
<Value Type="Collection">
   <ItemType Type="int" />
   <Items>
      <Value Value="0" />
      <Value Value="1" />
      <Value Value="2" />
      <Value Value="3" />
   </Items>
</Value>
*/
ValueMap.set('collection', {
   write: (node, value, options) => {
      let valueNode = node.ele('Value');

      if(options.includeTypeInfo) {
         types.write(valueNode, value.type);
      }

      var items = valueNode.ele('Items');

      for (let item of value) {
         _write(items, item, { includeTypeInfo: false });
      }
   },
   read: (node, type) => {
      let tpe = null;

      if(type) {
         tpe = type;
         return affinity.types.collection.value(tpe.itemType);
      } else {
         tpe = types.read(node.ItemType[0]);
         return affinity.types.collection.value(tpe);
      }
   }
});

ValueMap.set('instance-reference', {
   write: (node, value, options) => {
      writeValueWrap(node, value).ele('InstanceRef', { ref: value.instance.qualifiedName });
   },
   read: (node, type) => {

   }
});

/*
* Initialize the values module
*
* @param {Object} options Currently only contians the registered instance of affinity
*/
function init(options) {
   affinity = options.affinity || null;
}

/*
* Writes the value to XML
*
* @param {Object} node The xml2js XML node that is the parent of the to-be Value node
* @param {Object} value The affinity value to write
* @param {Object} opts The options when writing out the value
*               {bool} includeTypeInfo (default true) Set to true to include the Type info
*
*/
function _write(node, value, opts) {
   var writer = ValueMap.get(value.type.name);

   if (!writer) {
      throw new Error('Unsupported value encountered (writer): %s\n%s', value.type.name, value);
   }

   let options = opts || {};
   options.includeTypeInfo = opts.hasOwnProperty('includeTypeInfo') ? opts.includeTypeInfo : true;

   return writer.write(node, value, options);
}

/*
* Converts the given xml node into a affinity value
*
* @param {Object} node the <Value> xml node
* @param {Type} type Optional if the type info is not provided with the XML
* @return {Object} The affinity value
*/
function _read(node, type) {
   let name = null;

   if(type) {
      name = type.name;
   } else {
      name = node.$.Type;
   }

   var reader = ValueMap.get(name);

   if (!reader) {
      throw new Error('Unsupported value encountered (reader): %s', name);
   }

   return reader.read(node, type);
}

module.exports = {
   init: init,
   write: _write,
   read: _read
}