'use strict';

var Q = require('q');
var parseString = require('xml2js').parseString;
var types = require('./types.js');

function writeHeader(node, value) {
    var top = node.ele('Value');
    types.write(top, value.type);
    return top;
}

function readHeader(node) {
    return Q.nfbind(parseString(node));
}

var ValueMap = new Map();

ValueMap.set('boolean', {
    write: (node, value, wrapped) => {
        node.ele('Simple', {value: value.value});
    },
    read: (node) => {
        readHeader(node)
            .then(result => {
                console.log(result);
            })
    }
});

ValueMap.set('decimal', {
    write: (node, value, wrapped) => {
        node.ele('Simple', {value: value.value});
    },
    read: node => readHeader(node)
});

ValueMap.set('int', {
    write: (node, value, wrapped) => {
        node.ele('Simple', {value: value.value});
    },
    read: node => readHeader(node)
});

ValueMap.set('string', {
    write: (node, value, wrapped) => {
        node.ele('Simple', {value: value.value});
    },
    read: node => readHeader(node)
});

ValueMap.set('uint', {
    write: (node, value, wrapped) => {
        node.ele('Simple', {value: value.value});
    },
    read: node => readHeader(node)
});

/*
<Value>
    <Type name="collection">
        <ItemType>
            <Type name="int" />
        </ItemType>
    </Type>
    <Items>
        <Item>
            <Simple value="1" />
        </Item>
    
    </Items>
</Value>
*/
ValueMap.set('collection', {
    write: (node, value, wrapped) => {
        var items = node.ele('Items');
        
        for(let item of value) {
            console.log('item: ', item);
            _write(items, item, false);
        }        
    },
    read: node => {
        
    }
});

ValueMap.set('instance-reference', {
    write: (node, value, wrapped) => {
        writeHeader(node, value).ele('InstanceRef', {ref: value.instance.qualifiedName});
    },
    read: node => {
        
    }
});


function _write(node, value, wrapped) {
    console.log('writing value: ', value);
    var writer = ValueMap.get(value.type.name);
    
    if(!writer) {
        throw new Error('Unsupported Type encountered: %s', value.type.name);
    }

    wrapped = wrapped || true;
    
    if(wrapped) {
        node = writeHeader(node, value);
    }
    
    return writer.write(node, value, wrapped);   
}

module.exports.write = _write;