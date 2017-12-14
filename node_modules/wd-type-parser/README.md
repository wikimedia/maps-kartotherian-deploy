[![Build Status](https://travis-ci.org/nyurik/wd-type-parser.svg?branch=master)](https://travis-ci.org/nyurik/wd-type-parser)

# wd-type-parser
Given a value object as returned from Wikidata Query Service, returns a simplified value

```javascript
wtp = require('wd-type-parser');

o = { type:'uri', value:'http://www.wikidata.org/entity/Q12345' };
wtp(o); // 'Q12345'

o = { type:'literal', datatype:'http://www.opengis.net/ont/geosparql#wktLiteral', value:'Point(-64.2 -36.62)' };
wtp(o); // [-64.2, -36.62]

o = { type:'literal', datatype:'http://www.w3.org/2001/XMLSchema#integer', value:'42' };
wtp(o); // 42

// Unrecognized value
o = { type:'some type', datatype:'some unknown datatype', value:'la la la' };
wtp(o);       // 'la la la'
wtp(o, true); // undefined

```
