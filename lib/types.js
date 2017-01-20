'use strict';

var util = require('util');
var builder = require('xmlbuilder');
var parseString = require('xml2js').parseString;
var affinity = require('affinity');
var when = require('when');

parseString = when.lift(parseString);

function writePrimitive(node, type) {
    return node.att('Type', type.name);
}

function readPrimitive(node) {
    return parseString(node);
}

var TypeMap = new Map();

//------------------------------------------------------------------------
TypeMap.set('bool', {
    write: (node, type) => writePrimitive(node, type),
    read: (node) => affinity.types.bool.type()
});

//------------------------------------------------------------------------
TypeMap.set('decimal', {
    write: (node, type) => writePrimitive(node, type),
    read: node => affinity.types.decimal.type()
});

//------------------------------------------------------------------------
TypeMap.set('int', {
    write: (node, type) => writePrimitive(node, type),
    read: node => affinity.types.int.type()
});

//------------------------------------------------------------------------
TypeMap.set('string', {
    write: (node, type) => writePrimitive(node, type),
    read: node => affinity.types.string.type()
});

//------------------------------------------------------------------------
TypeMap.set('uint', {
    write: (node, type) => writePrimitive(node, type),
    read: node => affinity.types.uint.type()
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
TypeMap.set('collection', {
    write: (node, type) => {
        node.att('Type', 'collection');
        
        let itemTypeNode = node.ele('ItemType');
        return _write(itemTypeNode, type.itemType);
    },
    read: node => {
        let itemType = _read(node.ItemType[0]);
        return affinity.types.collection.type(itemType);
    }
});

TypeMap.set('instance-reference', {
    write: (node, type) => {
        node.att('Type', 'Reference');
        node.att('QualifiedName', type.model.qualifiedName);
    },
    read: node => readPrimitive(node) 
});

/*
*
* Note:
* The node is expected to be the 'Value' XML node
*/
function _write(node, type) {
    var writer = TypeMap.get(type.name);
    
    if(!writer) {
        var error = util.format('Unsupported Type encountered (write): %s', type.name);
        console.log(error)
        throw new Error(error);
    }

    return writer.write(node, type);
}

function _read(node) {
    let name = node.$.Type;

    var reader = TypeMap.get(name);
    
    if(!reader) {
        var error = util.format('Unsupported Type encountered (read): %s', name);
        console.log(error)
        throw new Error(error);
    }

    return reader.read(node);
}

module.exports = {
    write: _write,
    read: _read
}

