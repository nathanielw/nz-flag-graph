import d3 from 'd3';
import Sortable from 'sortablejs';
import flagData from './data.json';
import Chart from './chart';
import * as util from './util';
import assign from 'lodash.assign';

util.ready(function() {
	tidyData(flagData);
	let chart = createChart(flagData.counts);
	createDnD(flagData.choices.values().filter(function(d){ return d.pickable; }), chart);
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

function createDnD(choices, chart) {
	var flagsUnorderedEl = document.getElementById('flags-unordered');
	var flagsOrderedEl = document.getElementById('flags-ordered');

	var flagEls = d3.select(flagsUnorderedEl).selectAll('flag-drop__flag')
		.data(choices)
		.enter()
		.append('div')
		.attr('class', 'flag-drop__flag')
		.attr('data-id', d => d.key);

	flagEls.append('div')
		.attr('class', 'flag-drop__flag-img')
		.style('background-image', function(d) { return 'url(./resources/img/flags/' + d.img + ')' })
		.style('border-color', function(d) { return d.color });

	flagEls.append('div')
		.attr('class', 'flag-drop__flag-name')
		.text(function(d) { return d.name });

	var sortableOpts = { group: 'flags', animation: 200, ghostClass: 'flag-drop__flag--ghost', handle: '.flag-drop__flag-img', forceFallback: true, fallbackClass: 'flag-drop__flag--moving' }
	Sortable.create(flagsUnorderedEl, sortableOpts);
	var flagsOrdered = Sortable.create(flagsOrderedEl, assign({}, sortableOpts, { onSort: () => {
		chart.updateRanking(flagsOrdered.toArray());
	}}));
}

function createChart(counts) {
	let chart = new Chart(d3.select('#chart'), counts);

	let resizeTimer;
	let oldWidth;

	d3.select(window).on('resize', function() {
		// only fire if the width has changed
		if (oldWidth != this.innerWidth) {
			oldWidth = this.innerWidth;
			clearTimeout(resizeTimer);

			// Debouncing the resizing
			resizeTimer = setTimeout(() => {
				chart.render(250);
			}, 100);
		}
	});

	return chart;
}
