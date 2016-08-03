'use strict';

var when = require('when');
var parseString = require('xml2js').parseString;
var types = require('./types.js');

parseString = when.lift(parseString);

var gaia = null;

/*
 Writes the XML Value wrapper, with the optional Type header

 Header:
 <Value></Value>
*/
function writeValueWrap(node, value, opts) {
    var top = node.ele('Value');

    if(opts.includeTypeInfo) {
        types.write(top, value.type);
    }

    return top;
}

function readValueWrap(node) {
    return parseString(node);
}

function writeSimple(node, value) {
   return node.ele('Simple', {Value: value.value});
}

/*

Example:
<Value>
	<Type Name="int"/>
	<Simple value="1024"/>
</Value>

*/
function readSimple(node, onCreate) {
   let value = node.Simple[0].$.value;
   return onCreate(value);
}

var ValueMap = new Map();

/*
<Value>
	<Type Name="decimal"/>
	<Simple value="14.32"/>
</Value>
*/

ValueMap.set('bool', {
    write: (node, value) => writeSimple(node, value),
    read: (node) => readSimple(node, value => gaia.types.bool.value(value))
});

ValueMap.set('decimal', {
    write: (node, value) => writeSimple(node, value),
    read: (node) => readSimple(node, value => gaia.types.decimal.value(value))
});

ValueMap.set('int', {
    write: (node, value) => writeSimple(node, value),
    read: (node) => readSimple(node, value => gaia.types.int.value(value))
});

ValueMap.set('string', {
    write: (node, value) => writeSimple(node, value),
    read: (node) => readSimple(node, value => gaia.types.string.value(value))
});

ValueMap.set('uint', {
    write: (node, value) => writeSimple(node, value),
    read: (node) => readSimple(node, value => gaia.types.uint.value(value))
});

/*
<Value>
   <Type Name="collection">
      <ItemType>
        <Type Name="int"/>
      </ItemType>
   </Type>
   <Items>
      <Value>
         <Type Name="int"/>
         <Simple value="6"/>
      </Value>
      <Value>
         <Type Name="int"/>
         <Simple value="5"/>
      </Value>
      <Value>
         <Type Name="int"/>
         <Simple value="4"/>
      </Value>
      <Value>
         <Type Name="int"/>
         <Simple value="3"/>
      </Value>
      <Value>
         <Type Name="int"/>
         <Simple value="2"/>
      </Value>
      <Value>
         <Type Name="int"/>
         <Simple value="1"/>
      </Value>
   </Items>
</Value>
*/
ValueMap.set('collection', {
    write: (node, value) => {
        var items = node.ele('Items');
        
        for(let item of value) {
            _write(items, item, false);
        }        
    },
    read: node => {
        let type = types.read(node.Type[0].ItemType[0].Type[0]);
        return gaia.types.collection.value(type);
    }
});

ValueMap.set('instance-reference', {
    write: (node, value) => {
        writeValueWrap(node, value).ele('InstanceRef', {ref: value.instance.qualifiedName});
    },
    read: node => {
        
    }
});

/*
* Initialize the values module
*
* @param {Object} options Currently only contians the registered instance of gaia
*/
function init(options) {
   gaia = options.gaia || null;
}

/*
* Writes the value to XML
*
* @param {Object} node The xml2js XML node
* @param {Object} value The gaia value to write
* @param {Object} opts The options when writing out the value
*               {bool} wrapped  (default true) Set to true to include '<Value></Value>' wrapper
*               {bool} includeTypeInfo (default true) Set to true to include the Type info
*
*/
function _write(node, value, opts) {
    var writer = ValueMap.get(value.type.name);
    
    if(!writer) {
        throw new Error('Unsupported value encountered (writer): %s\n%s', value.type.name, value);
    }

    opts = opts || {};
    opts.wrapped = opts.hasOwnProperty('wrapped') ? opts.wrapped : true;
    opts.includeTypeInfo = opts.hasOwnProperty('includeTypeInfo') ? opts.includeTypeInfo : true;
    
    if(opts.wrapped) {
        node = writeValueWrap(node, value, opts);
    }
    
    return writer.write(node, value);   
}

/*
* Converts the given xml node into a gaia value
*
* @param {Object} node the <Value> xml node
* @return {Object} The gaia value
*/
function _read(node) {
   let name = node.Type[0].$.Name;
   var reader = ValueMap.get(name);

   if(!reader) {
        throw new Error('Unsupported value encountered (reader): %s', name);
    }

    return reader.read(node);
}

module.exports = {
    init: init,
    write: _write,
    read: _read
}