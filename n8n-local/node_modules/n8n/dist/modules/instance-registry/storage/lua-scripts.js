"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNREGISTER_SCRIPT = exports.CLEANUP_SCRIPT = exports.READ_ALL_SCRIPT = exports.REGISTER_SCRIPT = void 0;
exports.REGISTER_SCRIPT = `
redis.call('SET', KEYS[1], ARGV[1], 'EX', tonumber(ARGV[2]))
redis.call('SADD', KEYS[2], KEYS[1])
return 1
`;
exports.READ_ALL_SCRIPT = `
local members = redis.call('SMEMBERS', KEYS[1])
if #members == 0 then return {} end
local result = {}
local batch = 1000
for i = 1, #members, batch do
  local slice = {}
  for j = i, math.min(i + batch - 1, #members) do
    table.insert(slice, members[j])
  end
  local values = redis.call('MGET', unpack(slice))
  for _, v in ipairs(values) do
    if v ~= false then
      table.insert(result, v)
    end
  end
end
return result
`;
exports.CLEANUP_SCRIPT = `
local members = redis.call('SMEMBERS', KEYS[1])
if #members == 0 then return 0 end
local removed = 0
local batch = 1000
for i = 1, #members, batch do
  local slice = {}
  for j = i, math.min(i + batch - 1, #members) do
    table.insert(slice, members[j])
  end
  local values = redis.call('MGET', unpack(slice))
  for k, v in ipairs(values) do
    if v == false then
      redis.call('SREM', KEYS[1], members[i + k - 1])
      removed = removed + 1
    end
  end
end
return removed
`;
exports.UNREGISTER_SCRIPT = `
redis.call('DEL', KEYS[1])
redis.call('SREM', KEYS[2], KEYS[1])
return 1
`;
//# sourceMappingURL=lua-scripts.js.map