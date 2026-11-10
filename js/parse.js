/* What to Cook — turn a plain transcript into draft pantry items.
 * Rule-based and offline: no AI key, no network. Pure functions, so tests can run in Node.
 * The user always reviews the draft before anything is saved. */
(function (root) {
  'use strict';

  var NUMBER_WORDS = {
    a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
    nine: 9, ten: 10, dozen: 12, half: 0.5, quarter: 0.25, couple: 2, few: 3
  };
  var UNITS = ['g', 'kg', 'ml', 'l', 'cup', 'cups', 'tin', 'tins', 'can', 'cans', 'bottle', 'bottles',
    'bag', 'bags', 'box', 'boxes', 'pack', 'packs', 'packet', 'packets', 'jar', 'jars', 'loaf', 'loaves',
    'pint', 'litre', 'liter', 'lb', 'lbs', 'oz', 'tbsp', 'tsp', 'bunch', 'bunches', 'head', 'heads', 'clove',
    'cloves', 'stick', 'sticks', 'slice', 'slices', 'pot', 'pots', 'tub', 'tubs', 'carton', 'cartons'];
  var DROP = ['some', 'of', 'the', 'about', 'nearly', 'almost', 'maybe', 'lots', 'more', 'extra', 'still', 'left', 'there', 'is', 'are', 'we', 'have', 'got', 'gone', 'finished', 'a', 'an'];
  var LOW_WORDS = ['nearly', 'almost', 'low', 'running low', 'last', 'bit of', 'end of', 'empty'];
  var WET = ['milk', 'yogurt', 'yoghurt', 'cream', 'butter', 'cheese', 'eggs', 'egg', 'meat', 'chicken', 'beef', 'pork',
    'fish', 'salmon', 'mince', 'sausage', 'bacon', 'ham', 'tofu', 'juice', 'sauce', 'ketchup', 'mayo', 'hummus',
    'lettuce', 'spinach', 'cucumber', 'tomato', 'tomatoes', 'peppers', 'carrots', 'apples', 'bananas', 'berries',
    'grapes', 'peas', 'sweetcorn', 'fruit', 'veg', 'vegetables', 'herbs', 'cabbage', 'broccoli', 'leftovers', 'soup', 'stock'];
  var FREEZER = ['frozen', 'freezer', 'ice cream', 'peas (frozen)'];
  var TOOLS = ['knife', 'knives', 'pan', 'pot', 'whisk', 'blender', 'peeler', 'spatula', 'tongs', 'grater', 'oven dish', 'baking tray', 'kettle', 'toaster'];
  var SPACE = ['fridge shelf', 'freezer drawer', 'pantry shelf', 'cupboard', 'counter space', 'drawer'];
  var CATEGORY = [
    ['Dairy', ['milk', 'yogurt', 'yoghurt', 'cream', 'butter', 'cheese', 'eggs', 'egg']],
    ['Meat and fish', ['meat', 'chicken', 'beef', 'pork', 'fish', 'salmon', 'mince', 'sausage', 'bacon', 'ham']],
    ['Produce', ['lettuce', 'spinach', 'cucumber', 'tomato', 'tomatoes', 'peppers', 'carrots', 'apples', 'bananas', 'berries', 'grapes', 'peas', 'sweetcorn', 'fruit', 'veg', 'vegetables', 'herbs', 'cabbage', 'broccoli']],
    ['Grains and pasta', ['rice', 'pasta', 'flour', 'oats', 'bread', 'cereal', 'noodles', 'couscous', 'quinoa']],
    ['Tins and jars', ['beans', 'lentils', 'chickpeas', 'tomato paste', 'soup', 'stock', 'sauce', 'ketchup', 'mayo', 'hummus']],
    ['Baking and spices', ['sugar', 'salt', 'pepper', 'cinnamon', 'spice', 'baking powder', 'yeast', 'vanilla']]
  ];

  function words(s) { return s.toLowerCase().replace(/[^a-z0-9\s'().\/-]/g, ' ').split(/\s+/).filter(Boolean); }

  function parseQuantity(tokens) {
    var qty = null, unit = '', i = 0;
    var first = tokens[0] || '';
    if (/^\d+(\.\d+)?$/.test(first)) { qty = parseFloat(first); i = 1; }
    else if (/^\d+\/\d+$/.test(first)) { var p = first.split('/'); qty = parseInt(p[0], 10) / parseInt(p[1], 10); i = 1; }
    else if (NUMBER_WORDS.hasOwnProperty(first)) { qty = NUMBER_WORDS[first]; i = 1; }
    if (qty === null && tokens[0] === 'a' && tokens[1] === 'half') { qty = 0.5; i = 2; }
    if (qty !== null && tokens[i] === 'and' && tokens[i + 1] === 'a' && tokens[i + 2] === 'half') { qty += 0.5; i += 3; }
    // skip "a" / "an" / "of" between the number and the unit: "half a bag of rice", "one of the tins"
    var j = i;
    while (qty !== null && (tokens[j] === 'a' || tokens[j] === 'an' || tokens[j] === 'of')) j++;
    if (UNITS.indexOf(tokens[j]) !== -1) { unit = tokens[j]; i = j + 1; }
    var rest = tokens.slice(i);
    if (qty !== null && unit === '' && rest.length === 0) { return { qty: qty, unit: '', rest: [] }; }
    return { qty: qty, unit: unit, rest: rest };
  }

  function cleanName(tokens) {
    var out = tokens.filter(function (t) { return DROP.indexOf(t) === -1; });
    return out.join(' ').replace(/\s+/g, ' ').trim();
  }

  function guessKind(name) {
    if (TOOLS.some(function (t) { return name.indexOf(t) !== -1; })) return 'tool';
    if (SPACE.some(function (t) { return name.indexOf(t) !== -1; })) return 'space';
    if (WET.some(function (t) { return name.indexOf(t) !== -1; })) return 'wet';
    return 'dry';
  }

  function guessPlace(name, kind, lowerText) {
    if (FREEZER.some(function (t) { return lowerText.indexOf(t) !== -1; })) return 'freezer';
    if (kind === 'wet') return 'fridge';
    if (kind === 'dry') return 'pantry';
    return 'other';
  }

  function guessCategory(name) {
    for (var i = 0; i < CATEGORY.length; i++) {
      if (CATEGORY[i][1].some(function (t) { return name.indexOf(t) !== -1; })) return CATEGORY[i][0];
    }
    return '';
  }

  // Split on new lines, commas, semicolons, full stops and the word "and" (but not inside "fish and chips" style names; the review step fixes those).
  function splitChunks(text) {
    return String(text || '')
      .split(/\n|[,;]|\.(?=\s|$)|\s+and\s+(?=(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|half|a|an|some)\b)/i)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function parseLine(line) {
    var lower = line.toLowerCase();
    var toks = words(line);
    var q = parseQuantity(toks);
    var name = cleanName(q.rest);
    if (!name) return null;
    var kind = guessKind(name);
    var low = LOW_WORDS.some(function (w) { return lower.indexOf(w) !== -1; });
    return {
      name: name,
      kind: kind,
      category: guessCategory(name),
      quantity: q.qty,
      unit: q.unit,
      stored_location: guessPlace(name, kind, lower),
      quality: low ? 'fair' : 'unknown',
      notes: low ? 'running low (from: ' + line.trim() + ')' : '',
      raw: line.trim()
    };
  }

  function parseTranscript(text) {
    return splitChunks(text).map(parseLine).filter(Boolean);
  }

  var api = { parseTranscript: parseTranscript, parseLine: parseLine, splitChunks: splitChunks, parseQuantity: parseQuantity };
  root.WTCParse = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
