/* exported stvChart */
/* global stvChart d3  */

function stvChart() {
	var width = 800,
		height = 600,
		nodeSizeRatio = 0.2,
		counts = [],
		flows = [];

	function chart() {}

	chart.width = function(val) {
		if (!arguments.length) { return width }
		width = val;
		return chart;
	}

	chart.height = function(val) {
		if (!arguments.length) { return height }
		height = val;
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
		var xScale = d3.scale.ordinal()
			.domain(counts.map(function(d) { return d.name }))
			.rangeBands([0, width], 1 - nodeSizeRatio, 0);

		var yScale = d3.scale.linear()
			.domain([0, d3.sum(counts[0].totals.values(), function(d) { return d.votes })])
			.range([0, height]);

		computeNodeGeometry(xScale, yScale);

		return chart;
	}

	function computeNodeGeometry(xScale, yScale) {
		counts.forEach(function(count, i) {
			var x = xScale(count.name);
			var dx = xScale.rangeBand(count.name);

			var yAcummulated = 0;

			// Add geometry data to each candidate in this count/round
			count.totals.forEach(function(k, v) {
				v.geo = {
					x: x,
					dx: dx,

					y: yScale(yAcummulated),
					dy: yScale(v.votes)
				}

				yAcummulated += v.votes;
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
						break;
					}
				}

				var elimVoteOffset = 0;

				count.totals.forEach(function(k, v) {
					var prevTotal = prevCount.totals.get(k);
					var newVotes = v.votes - prevTotal.votes;

					flows.push(new Flow(prevTotal.votes, yScale, 0, 0, prevTotal, v));

					if (newVotes > 0) {
						flows.push(new Flow(newVotes, yScale, prevTotal.votes, elimVoteOffset, eliminated, v));
						elimVoteOffset += newVotes;
					}
				});
			}
		});
	}

	function Flow(votes, yScale, fromVoteOffset, toVoteOffset,  from, to) {
		var width = yScale(votes);

		this.from = from;
		this.to = to;
		this.votes = votes;

		this.geo = {
			x0: from.geo.x + from.geo.dx,
			x1: to.geo.x,
			y0: from.geo.y + (width / 2) + yScale(toVoteOffset),
			y1: to.geo.y + (width / 2) + yScale(fromVoteOffset),
			width: width
		}
	}

	return chart;
}
