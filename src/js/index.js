var d3 = require('d3'),
	Sortable = require('sortablejs'),
	d3tip = require('d3-tip'),
	stvChart = require('./stvChart'),
	flagData = require('./data.json'),
	util = require('./util');

d3tip(d3);

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
		width = parseInt(d3.select('#chart').style('width')) - margin.left - margin.right,
		height = 800 - margin.top - margin.bottom;

	var numberFormatter = d3.format(',');

	var flagTip = d3.tip()
		.attr('class', 'graph-tooltip')
		.offset([-5, 0])
		.html(function(d) {
			var html = `
			<div>
				<div class="graph-tooltip__header">
					<div class="${d.data.img ? 'graph-tooltip__header-left' : ''}">
						<h3 class="graph-tooltip__title"><span class="flag-dot" style="background:${d.data.color}"></span>${d.data.name}</h3>
						<span class="graph-tooltip__subtitle">${numberFormatter(d.votes)} votes</span>
					</div>
					${d.data.img ? `<img src="/resources/img/flags/${d.data.img} " class="graph-tooltip__img" />` : ''}
				</div>

				${function() {
					if (d.flowsOutgoing.length > 1) {
						return `
						<div class="graph-tooltip__body">
							<h4>Votes transfered:</h4>
							<table class="flag-transfer-table">
								${function(){
									var list = '';
									d.flowsOutgoing.forEach(v => {
										list += `<tr class="flag-transfer-list__item">
												<td>${Math.round(v.votes/d.votes*100)}% (${numberFormatter(v.votes)} votes)</td>
												<td><span class="flag-dot" style="background:${v.to.data.color}"></span>${v.to.data.name}</td>
											</tr>`;
									});

									return list;
								}()}
							</table>
						</div>`;
					} else {
						return '';
					}
				}()}
			</div>`

			return html;
		});

	var chartElement = d3.select('#chart').append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	chartElement.call(flagTip);

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
		.attr('fill', function(d) { return d.data.color })
		.on('mouseover', flagTip.show)
		.on('mouseout', flagTip.hide);


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
		.style('fill', 'none')
		.sort(function(a, b) {
			return b.votes - a.votes;
		});

	d3.select(window).on('resize', function() {
		resize(counts);
	});
}

function resize(counts) {
	// TODO: debounce this and possibly make the redrawing more efficient (i.e. don't remove the elements, just resize them)
	d3.select('#chart').selectAll('*').remove();
	createChart(counts);
}

function updateRanking(ranking) {
	/*
	go through each round/count
		if rank[0] is in the count, highlight it
		if not, remove it from the ranking
		repeat (until valid 1st choice is found or no rankings remain)
	 */
}
