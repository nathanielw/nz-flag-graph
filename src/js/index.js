var d3 = require('d3'),
	Sortable = require('sortablejs'),
	stvChart = require('./stvChart'),
	flagData = require('./data.json'),
	util = require('./util');

util.ready(function() {
	tidyData(flagData);
	createDnD(flagData.choices.values().filter(function(d){ return d.pickable; }));
	createChart(flagData.counts);
});

function tidyData(data) {
	data.choices = d3.map(data.choices, function(f) { return f.key });

	data.counts.forEach(function(d) {
		d.totals = d3.map(d.totals, function(f) { return f.key });

		d.totals.forEach(function(k, v) {
			v.data = data.choices.get(k);
		});
	});
}

function createDnD(choices) {
	var flagsUnorderedEl = document.getElementById('flags-unordered');
	var flagsOrderedEl = document.getElementById('flags-ordered');

	var flagEls = d3.select(flagsUnorderedEl).selectAll('flag-drop__flag')
		.data(choices)
		.enter()
		.append('div')
		.attr('class', 'flag-drop__flag');

	flagEls.append('div')
		.attr('class', 'flag-drop__flag-img')
		.style('background-image', function(d) { return 'url(./resources/img/flags/' + d.img + ')' })
		.style('border-color', function(d) { return d.color });

	flagEls.append('div')
		.attr('class', 'flag-drop__flag-name')
		.text(function(d) { return d.name });

	var sortableOpts = { group: 'flags', animation: 200, ghostClass: 'flag-drop__flag--ghost', handle: '.flag-drop__flag-img', forceFallback: true, fallbackClass: 'flag-drop__flag--moving' }
	Sortable.create(flagsUnorderedEl, sortableOpts);
	Sortable.create(flagsOrderedEl, sortableOpts);
}

function createChart(counts) {
	var margin = {top: 0, right: 0, bottom: 0, left: 0},
		width = 350 - margin.left - margin.right,
		height = 800 - margin.top - margin.bottom;

	var chartElement = d3.select('#chart').append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	var chart = stvChart()
		.width(width)
		.height(height)
		.nodeSizeRatio(0.15)
		.counts(counts)
		.layout();

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
		.attr('fill', function(d) { return d.data.color });


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
		.style('stroke', function(d) { return d.from.data.color })
		.style('stroke-width', function(d) { return d.geo.width })
		.style('opacity', '0.5')
		.style('fill', 'none');
}
