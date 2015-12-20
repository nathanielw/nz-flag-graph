/* exported stvChart */
/* global stvChart d3  */

function stvChart(selector, data, opts) {
	opts = opts || {};

	var margin = opts.margin || {top: 0, right: 0, bottom: 0, left: 0},
		width = opts.width || 800 - margin.left - margin.right,
		height = opts.height || 600 - margin.top - margin.bottom,
		nodePadding = opts.nodePadding || 0,
		nodeFlowRatio = opts.nodeFlowRatio || 0.2;

	var chart = d3.select(selector).append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	var xScale = d3.scale.ordinal()
		.domain(data.counts.map(function(d) { return d.name }))
		.rangeBands([margin.left, width], 1 - nodeFlowRatio, 0);

	var yScale = d3.scale.linear()
		.domain([0, 1])
		.range([margin.top, height]);

	function computeNodeGeometry() {
		data.counts.forEach(function(count){
			var y0 = 0;

			count.totals.forEach(function(k, v) {
				// Add raw y-values - the next loop normalizes them
				v.geo = {
					y: y0,
					dy: v.votes
				};

				y0 += v.votes;
			});

			count.totals.forEach(function(k, v) {
				v.geo.x = xScale(count.name);
				v.geo.dx = xScale.rangeBand(count.name);

				v.geo.y = yScale(v.geo.y/y0);
				v.geo.dy = yScale(v.geo.dy/y0);

				// TODO: Combine flowGeo calc into here so that stuff like y0 can be used to do positioning
			});
		});
	}

	function computeFlowGeometry() {
		var flows = [];

		for (var i = 1; i < data.counts.length; i++) {
			var count = data.counts[i];
			var prevCount = data.counts[i-1];

			var prevKeys = prevCount.totals.keys();

			var eliminated;

			for (var j = 0; j < prevKeys.length; j++) {
				if (!count.totals.has(prevKeys[j])) {
					eliminated = prevCount.totals.get(prevKeys[j]);
					break;
				}
			}

			count.totals.forEach(function(k, v) {
				var prevTotal = prevCount.totals.get(k);
				var newVotes = v.votes - prevTotal.votes;

				flows.push(new Flow(prevTotal.votes, prevTotal, v));

				if (newVotes > 0) {
					flows.push(new Flow(newVotes, eliminated, v));
				}
			});

			/*
				figure out which was eliminated (compare arrays)

				for each flag's total:
					figure out how many votes it gained
					add a flow to the same flag in the previous count
					add a flow to the eliminated flag with a size equal to the votes gained
			*/
		}

		return flows;
	}

	function Flow(votes, from, to) {
		this.from = from;
		this.to = to;
		this.votes = votes;

		this.geo = {
			xL: from.geo.x + from.geo.dx,
			xR: to.geo.x,
			yTL: from.geo.y,
			yBL: from.geo.y + votes/from.votes * from.geo.dy,
			yTR: to.geo.y,
			yBR: to.geo.y + votes/to.votes * to.geo.dy
		}
	}

	// DRAWING STUFF TODO: Move elsewhere

	computeNodeGeometry();
	var flows = computeFlowGeometry();

	var colors = d3.scale.category10()
		.domain(data.choices.map( function(d) { return d.key }));

	var count = chart.selectAll('.count')
		.data(data.counts)
		.enter()
		.append('g')
		.attr('class', 'count')
		.attr('transform', function(d) { return 'translate(' + xScale(d.name) + ', 0)' });

	count.selectAll('rect')
		.data(function(d) { return d.totals.values() })
		.enter()
		.append('rect')
		.attr('class', 'flag-node')
		.attr('width', function(d) { return d.geo.dx })
		.attr('height', function(d) { return d.geo.dy })
		.attr('y', function(d) { return d.geo.y })
		.attr('fill', function(d) { return colors(d.key) });

	var flowsGroup = chart.append('g')
		.attr('class', 'flows');

	flowsGroup.selectAll('.flow')
		.data(flows)
		.enter()
		.append('path')
		.attr('class', 'flow')
		.attr('d', function(d) {
			var dist = d.geo.xR - d.geo.xL;

			var outerCurveX = dist/1.5;
			var innerCurveX = Math.max(dist/2, dist/1.5 * (1 - ((d.geo.yBL - d.geo.yTL)/dist)));

			if (d.geo.yTL < d.geo.yTR) {
				var t = outerCurveX;
				outerCurveX = innerCurveX;
				innerCurveX = t;
			}

			return 'M' +  d.geo.xL + ',' + d.geo.yTL
				+ ' C' + (d.geo.xL + innerCurveX) + ',' + d.geo.yTL
				+ ' ' + (d.geo.xR - outerCurveX) + ',' + d.geo.yTR
				+ ' ' + d.geo.xR + ',' + d.geo.yTR
				+ ' L' + d.geo.xR + ',' + d.geo.yBR
				+ ' C' + (d.geo.xR - innerCurveX) + ',' + d.geo.yBR
				+ ' ' + (d.geo.xL + outerCurveX) + ',' + d.geo.yBL
				+ ' ' + d.geo.xL + ',' + d.geo.yBL
				+ ' z';
		})
		.style('fill', '#333')
		.style('opacity', '0.2');

}
