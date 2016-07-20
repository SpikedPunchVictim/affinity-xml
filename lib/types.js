'use strict';

var util = require('util');
var builder = require('xmlbuilder');
var parseString = require('xml2js').parseString;
var gaia = require('gaia');
var when = require('when');

parseString = when.lift(parseString);

function writeHeader(node, type) {
    return node.ele('Type', { Name: type.name });
}

function readHeader(node) {
    return parseString(node);
}

// var primitive = {
//     write(node, type) {
//         return node.ele('Type', { Name: type.name });
//     }

//     read(node => gaia.types.
// };

function writePrimitive(node, type) {

}

var TypeMap = new Map();

TypeMap.set('bool', {
    write: (node, type) => writeHeader(node, type),
    read: (node) => gaia.types.bool.type()
});

TypeMap.set('decimal', {
    write: (node, type) => writeHeader(node, type),
    read: node => gaia.types.decimal.type()
});

TypeMap.set('int', {
    write: (node, type) => writeHeader(node, type),
    read: node => gaia.types.int.type()
});

TypeMap.set('string', {
    write: (node, type) => writeHeader(node, type),
    read: node => gaia.types.string.type()
});

TypeMap.set('uint', {
    write: (node, type) => writeHeader(node, type),
    read: node => gaia.types.uint.type()
});

/*
<Type Name="collection">
	<ItemType>
	    <Type Name="int"/>
	</ItemType>
</Type>


*/
TypeMap.set('collection', {
    write: (node, type) => {
        var itemType = writeHeader(node, type).ele('ItemType');
        return _write(itemType, type.itemType);
    },
    read: node => {
        let itemType = _read(node.ItemType.Type);
        return gaia.types.collection.type(itemType);
    }
});

TypeMap.set('instance-reference', {
    write: (node, type) => {
        writeHeader(node, type).ele('Reference', {QualifiedName: type.model.qualifiedName});
    },
    read: node => readHeader(node) 
});

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
    let name = node.$.Name;

    var reader = TypeMap.get(type.name);
    
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

