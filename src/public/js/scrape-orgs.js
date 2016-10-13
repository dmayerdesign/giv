!function() {
	var Scrape = (function() {
		function Scrape(selector) {
			this.body = document.querySelector(selector);
		}
		
		Scrape.prototype.scrapeOrgs = function(options) {
			this.options = options;
			console.log("Document: ", this.body);
			if (!this.options || !this.body) return null;
			if (!this.options.orgSelector) return null;

			var _this = this;
			var orgs = [];

			var orgSelector = this.options.orgSelector;
			var orgElements = this.body.querySelectorAll(orgSelector);

			orgElements.forEach(function(org, index, arr) {
				var orgData = {};
				for (property in _this.options) {
					var selector = _this.options[property];
					var orgElement = org.querySelector(selector);
					var orgDatum;

					if (property === "orgSelector") continue;
					else if (property === "website") {
						orgDatum = orgElement.getAttribute("href");
						orgData["donateLink"] = orgDatum;
					}
					else if (property === "category") {
						orgDatum = selector;
					}
					else {
						orgDatum = orgElement.textContent;
					}

					orgData[property] = orgDatum;
				}
				orgs.push(orgData);
			});

			return orgs;
		};

		return Scrape;
	}());

	var options = {
		category: "environmental",
		categoryName: "Environmental justice",
		orgSelector: ".solutions-bullets li",
		name: "a",
		website: "a"
	};
	console.log("Options before: ", options);
	var data = new Scrape(".synergy-column").scrapeOrgs(options);

	localStorage.setItem("Scraped_Orgs", JSON.stringify(data));

}();