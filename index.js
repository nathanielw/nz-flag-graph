/* global stvChart d3 */

function ready(fn) {
	if (document.readyState != 'loading'){
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

ready(function() {
	d3.json('data.json', function(error, json) {
		if (!error) {

			json.counts.forEach(function(d) {
				d.totals = d3.map(d.totals, function(f) { return f.key });
			});

			stvChart('#chart', json);
		}
	});
});
