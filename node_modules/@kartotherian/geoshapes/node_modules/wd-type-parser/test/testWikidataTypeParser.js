'use strict';

var assert = require('assert'),
    wikidataTypeParser = require('../src/wikidataTypeParser');

describe('type parser', function() {

    it('unrecognized values', function () {
        function test(obj) {
            assert.equal(wikidataTypeParser(obj), undefined);
            assert.equal(wikidataTypeParser(obj, true), undefined);
        }

        test();
        test([]);
        test([1]);
        test({});
        test({a: 1});
        test(false);
        test(true);
        test("");
        test("a");
        test(0);
        test(10);
        test({type: 'literal'});
    });

    it('pass values', function () {
        function test(type, datatype, value, expected) {
            var obj = {type: type, value: value};
            if (datatype) obj.datatype = datatype;
            assert.deepStrictEqual(wikidataTypeParser(obj, true), expected);
        }

        test('literal', 'http://www.w3.org/2001/XMLSchema#double', '42.1', 42.1);
        test('literal', 'http://www.w3.org/2001/XMLSchema#float', '42.2', 42.2);
        test('literal', 'http://www.w3.org/2001/XMLSchema#decimal', '42', 42);
        test('literal', 'http://www.w3.org/2001/XMLSchema#integer', '-43', -43);
        test('literal', 'http://www.w3.org/2001/XMLSchema#long', '44', 44);
        test('literal', 'http://www.w3.org/2001/XMLSchema#int', '-45', -45);
        test('literal', 'http://www.w3.org/2001/XMLSchema#short', '46', 46);
        test('literal', 'http://www.w3.org/2001/XMLSchema#nonNegativeInteger', '47', 47);
        test('literal', 'http://www.w3.org/2001/XMLSchema#positiveInteger', '48', 48);
        test('literal', 'http://www.w3.org/2001/XMLSchema#unsignedLong', '49', 49);
        test('literal', 'http://www.w3.org/2001/XMLSchema#unsignedInt', '50', 50);
        test('literal', 'http://www.w3.org/2001/XMLSchema#unsignedShort', '52', 52);
        test('literal', 'http://www.w3.org/2001/XMLSchema#nonPositiveInteger', '53', 53);
        test('literal', 'http://www.w3.org/2001/XMLSchema#negativeInteger', '54', 54);

        test('literal', 'http://www.opengis.net/ont/geosparql#wktLiteral', 'Point(-64.2 -36.62)', [-64.2, -36.62]);

        test('uri', undefined, 'http://www.wikidata.org/entity/Q12345', 'Q12345');
    });

    it('fail values', function () {
        function test(type, datatype, value) {
            var obj = {type: type, value: value};
            if (datatype) obj.datatype = datatype;
            assert.deepStrictEqual(wikidataTypeParser(obj, true), undefined);
        }

        test('literal', 'http://www.w3.org/2001/XMLSchema#double', '42.100');
        test('literal', 'http://www.opengis.net/ont/geosparql#wktLiteral', 'Point(-64.2a -36.62)', [-64.2, -36.62]);
        test('uri', undefined, 'http://www.wikidata.org/entity/Q12345a');
    });

});
