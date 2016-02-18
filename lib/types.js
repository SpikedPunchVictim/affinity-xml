'use strict';
var util = require('util');
var builder = require('xmlbuilder');
var parseString = require('xml2js').parseString;
var gaia = require('gaia');
var Q = require('q');

function writeHeader(node, type) {
    return node.ele('Type', { Name: type.name });
}

function readHeader(node) {
    return Q.nfbind(parseString(node));
}

var TypeMap = new Map();

TypeMap.set('boolean', {
    write: (node, type) => writeHeader(node, type),
    read: (node) => {
        readHeader(node)
            .then(result => {
                console.log(result);
            })
    }
});

TypeMap.set('decimal', {
    write: (node, type) => writeHeader(node, type),
    read: node => readHeader(node)
});

TypeMap.set('int', {
    write: (node, type) => writeHeader(node, type),
    read: node => readHeader(node)
});

TypeMap.set('string', {
    write: (node, type) => writeHeader(node, type),
    read: node => readHeader(node)
});

TypeMap.set('uint', {
    write: (node, type) => writeHeader(node, type),
    read: node => readHeader(node)
});

TypeMap.set('collection', {
    write: (node, type) => {
        var itemType = writeHeader(node, type).ele('ItemType');
        return _write(itemType, type.itemType);
    },
    read: node => {
        
    }
});

TypeMap.set('instance-reference', {
    write: (node, type) => {
        writeHeader(node, type).ele('Reference', {QualifiedName: type.model.qualifiedName});
    },
    read: node => readHeader(node) 
});

function _write(node, type) {
    console.log('writing type: ', type);
    
    var writer = TypeMap.get(type.name);
    
    if(!writer) {
        var error = util.format('Unsupported Type encountered: %s', type.name);
        console.log(error)
        throw new Error(error);
    }

    return writer.write(node, type);
}

module.exports.write = _write;

