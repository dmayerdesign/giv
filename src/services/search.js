module.exports = function(search, field) {
	var query = {};
  field = field || "name";
  if (typeof search === "string" && search.length) {
      query[field] = { "$regex": search, "$options": "i" };
  }
  return query;
}