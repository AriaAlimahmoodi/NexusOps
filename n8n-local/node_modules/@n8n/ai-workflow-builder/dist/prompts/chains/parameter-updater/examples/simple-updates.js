"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIMPLE_UPDATE_EXAMPLES = void 0;
exports.SIMPLE_UPDATE_EXAMPLES = {
    patterns: ['*'],
    content: `
## Examples of Parameter Updates

### Example 1: Update HTTP Request URL
Change: "Set the URL to call the weather API for London"
Current parameters: { "url": "https://api.example.com", "method": "GET" }
Updated parameters: { "url": "https://api.openweathermap.org/data/2.5/weather?q=London", "method": "GET" }

### Example 2: Add a header
Change: "Add an ABC key header with value 123"
Current parameters: { "url": "...", "sendHeaders": false }
Updated parameters: {
  "url": "...",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "ABC",
        "value": "123"
      }
    ]
  }
}

### Example 3: Update condition
Change: "Check if temperature is above 25 degrees"
Current parameters: { "conditions": { "conditions": [] } }
Updated parameters: {
  "conditions": {
    "options": {
      "caseSensitive": false,
      "leftValue": "",
      "typeValidation": "loose"
    },
    "conditions": [
      {
        "leftValue": "={{ $('Weather Node').item.json.main.temp }}",
        "rightValue": 25,
        "operator": {
          "type": "number",
          "operation": "gt"
        }
      }
    ],
    "combinator": "and"
  }
}`,
};
//# sourceMappingURL=simple-updates.js.map