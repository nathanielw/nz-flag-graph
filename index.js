/* global stvChart d3 */

function ready(fn) {
	if (document.readyState != 'loading'){
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

ready(function() {
	var margin = {top: 0, right: 0, bottom: 0, left: 0},
		width = 800 - margin.left - margin.right,
		height = 800 - margin.top - margin.bottom;

	var chartElement = d3.select('#chart').append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	d3.json('data.json', function(error, json) {
		if (!error) {

			json.counts.forEach(function(d) {
				d.totals = d3.map(d.totals, function(f) { return f.key });
			});

			var chart = stvChart()
				.width(width)
				.height(height)
				.nodeSizeRatio(0.15)
				.counts(json.counts)
				.layout();


			var colors = d3.scale.category10()
				.domain(json.choices.map( function(d) { return d.key }));

			var countGroups = chartElement.selectAll('.count')
				.data(chart.counts())
				.enter()
				.append('g')
				.attr('class', 'count');

			countGroups.selectAll('rect')
				.data(function(d) { return d.totals.values() })
				.enter()
				.append('rect')
				.attr('class', 'flag-node')
				.attr('width', function(d) { return d.geo.dx })
				.attr('height', function(d) { return d.geo.dy })
				.attr('y', function(d) { return d.geo.y })
				.attr('x', function(d) { return d.geo.x })
				.attr('fill', function(d) { return colors(d.key) });


			var flowsGroup = chartElement.append('g')
				.attr('class', 'flows');

			flowsGroup.selectAll('.flow')
				.data(chart.flows())
				.enter()
				.append('path')
				.attr('class', 'flow')
				.attr('d', function(d) {
					var dist = d.geo.y1 - d.geo.y0;

					return 'M' +  d.geo.x0 + ',' + d.geo.y0
						+ ' C' + d.geo.x0 + ',' + (d.geo.y0 + dist/2)
						+ ' ' + d.geo.x1 + ',' + (d.geo.y1 - dist/2)
						+ ' ' + d.geo.x1 + ',' + d.geo.y1;
				})
				.style('stroke', function(d) { return colors(d.from.key) })
				.style('stroke-width', function(d) { return d.geo.width })
				.style('opacity', '0.2')
				.style('fill', 'none');
		}
	});
});
