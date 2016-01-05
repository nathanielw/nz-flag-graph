export default stvChart;

import d3 from 'd3';

function stvChart() {
	var height = 800,
		width = 600,
		nodeSizeRatio = 0.2,
		counts = [],
		flows = [];

	function chart() {}

	chart.height = function(val) {
		if (!arguments.length) { return height }
		height = val;
		return chart;
	}

	chart.width = function(val) {
		if (!arguments.length) { return width }
		width = val;
		return chart;
	}

	chart.nodeSizeRatio = function(val) {
		if (!arguments.length) { return nodeSizeRatio }
		nodeSizeRatio = val;
		return chart;
	}

	chart.counts = function(val) {
		if (!arguments.length) { return counts }
		counts = val;
		return chart;
	}

	chart.flows = function() {
		return flows;
	}

	chart.layout = function() {
		var yScale = d3.scale.ordinal()
			.domain(counts.map(function(d) { return d.name }))
			.rangeBands([0, height], 1 - nodeSizeRatio, 0);

		var xScale = d3.scale.linear()
			.domain([0, d3.sum(counts[0].totals.values(), function(d) { return d.votes })])
			.range([0, width]);

		computeNodeGeometry(yScale, xScale);

		return chart;
	}

	function computeNodeGeometry(yScale, xScale) {
		flows = [];

		counts.forEach(function(count, i) {
			var y = yScale(count.name);
			var dy = yScale.rangeBand(count.name);

			var xAcummulated = 0;

			// Add geometry and other data to each candidate in this count/round
			count.totals.forEach(function(k, v) {
				v.geo = {
					y: y,
					dy: dy,

					x: xScale(xAcummulated),
					dx: xScale(v.votes)
				}

				v.flowsIncoming = [];
				v.flowsOutgoing = [];

				xAcummulated += v.votes;
			});

			// Add flows going from each candidate in the current count back to the previous count.
			if (i > 0) {
				var prevCount = counts[i-1];
				var prevCountKeys = prevCount.totals.keys();
				var eliminated;

				for (var j = 0; j < prevCountKeys.length; j++) {
					// Figure out which candidate has been removed since the previous count
					if (!count.totals.has(prevCountKeys[j])) {
						eliminated = prevCount.totals.get(prevCountKeys[j]);
						eliminated.eliminated = true;
						break;
					}
				}

				var elimVoteOffset = 0;

				count.totals.forEach(function(k, v) {
					var prevTotal = prevCount.totals.get(k);
					var newVotes = v.votes - prevTotal.votes;

					// add a flow from the same flag in the previous count to this one
					flows.push(new Flow(prevTotal.votes, xScale, 0, 0, prevTotal, v, i));

					if (newVotes > 0) {
						// If votes were gained, add a flow from the eliminated flag to this one
						flows.push(new Flow(newVotes, xScale, prevTotal.votes, elimVoteOffset, eliminated, v, i));
						elimVoteOffset += newVotes;
					}
				});
			}
		});
	}

	function Flow(votes, xScale, fromVoteOffset, toVoteOffset,  from, to, fromRound) {
		var width = xScale(votes);

		this.from = from;
		this.to = to;
		this.votes = votes;
		this.id = fromRound + '_' + from.key + '_' + to.key;

		this.geo = {
			y0: from.geo.y + from.geo.dy,
			y1: to.geo.y,
			x0: from.geo.x + (width / 2) + xScale(toVoteOffset),
			x1: to.geo.x + (width / 2) + xScale(fromVoteOffset),
			width: width
		}

		from.flowsOutgoing.push(this);
		to.flowsIncoming.push(this);
	}

	return chart;
}
