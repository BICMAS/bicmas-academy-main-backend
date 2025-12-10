"use strict";

var _express = _interopRequireDefault(require("express"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _redis = require("redis");
var _pg = require("pg");
var _console = require("console");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const app = (0, _express.default)();
const port = process.env.PORT || 5000;
_dotenv.default.config();
app.use(_express.default.json());
app.get('/', (req, res) => {
  res.send('Hello World! this is an LLM project');
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});