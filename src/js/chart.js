import d3 from 'd3';
import d3tip from 'd3-tip';
import stvChart from './stvChart';

d3tip(d3);

const numberFormatter = d3.format(',');
const TRANSITION_SPEED = 250;

module.exports = class Chart {
	/**
	 * Create a chart within the given element using the given count data.
	 * @param {d3.selection} chartContainer A d3 selection within which the chart will be created.
	 * @param {array} counts The data to be graphed.
	 */
	constructor(chartContainer, counts) {
		this.chartContainer = chartContainer;
		this.counts = counts;
		this.ranking = [];
		this.highlightRanking = false;
		this.margin = {top: 0, right: 0, bottom: 0, left: 0};
		this.width = 0;
		this.height = 920 - this.margin.top - this.margin.bottom;

		this.flagTip = d3.tip()
			.attr('class', 'graph-tooltip')
			.offset([-5, 0])
			.html(d => {
				let html = `
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
										let list = '';
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

		const checkId = 'highlight-checkbox';

		let checkContainer = chartContainer.append('span')
			.attr('class', 'graph-controls');

		this.highlightCheckbox = checkContainer.append('input')
			.attr('type', 'checkbox')
			.attr('class', 'custom-checkbox')
			.attr('id', checkId)
			.on('click', () => {
				this.setHighlightRanking(this.highlightCheckbox.property('checked'));
			});

		checkContainer.append('label')
			.attr('class', 'custom-checkbox__label')
			.text('Highlight my vote')
			.attr('for', checkId);

		this.svg = chartContainer.append('svg');
		this.chartElement = this.svg.append('g');

		this.chartElement.call(this.flagTip);

		this.presenter = stvChart()
			.width(this.width)
			.height(this.height)
			.nodeSizeRatio(0.12)
			.counts(this.counts);

		this.render(0);
	}

	/**
	 * Updates the underlying layout model and updates the graph DOM to reflect any layout changes
	 * (data changes are not considered).
	 * @param {?number} transitionSpeed Duration of the transition to the new layout
	 */
	render(transitionSpeed=0) {
		let containerWidth = parseInt(this.chartContainer.style('width'));

		if (containerWidth < 580) {
			this.margin.left = 0;
		} else {
			this.margin.left = 80;
		}

		let newWidth = containerWidth - this.margin.left - this.margin.right;

		let transition = function(selection) {
			return selection.transition()
				.duration(transitionSpeed)
				.ease('linear');
		}

		// re-calc the graph layout only if the size has changed
		if (this.width !== newWidth) {
			this.width = newWidth;

			transition(this.chartElement).attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

			this.svg.attr('width', this.width + this.margin.left + this.margin.right)
				.attr('height', this.height + this.margin.top + this.margin.bottom);

			this.presenter
				.width(this.width)
				.layout();
		}

		let yAxis = this.chartElement.select('g.axis--y');

		if (yAxis.empty()) {
			yAxis = this.chartElement.append('g')
				.attr('class', 'axis axis--y');
		}

		transition(yAxis).call(
			this.presenter.yAxis()
				.tickSize(0, 0)
				.tickPadding(15));

		let countGroups = this.chartElement.selectAll('.count')
			.data(this.presenter.counts());

		countGroups.enter()
			.append('g')
			.attr('class', 'count');

		let counts = countGroups.selectAll('rect')
			.data(d => d.totals.values());

		counts.enter()
			.append('rect')
			.attr('class', 'flag-node')
			.on('mouseover', this.flagTip.show)
			.on('mouseout', this.flagTip.hide);

		transition(counts)
			.attr('width', d => d.geo.dx)
			.attr('height', d => d.geo.dy)
			.attr('y', d => d.geo.y)
			.attr('x', d => d.geo.x)
			.attr('fill', d => d.data.color)
			.attr('opacity', (d) => ((!this.highlightRanking || d.votedFor) ? 1 : 0.5));


		let flowsGroup = this.chartElement.select('.flows');

		if (flowsGroup.empty()) {
			flowsGroup = this.chartElement.append('g')
				.attr('class', 'flows');
		}

		let flows = flowsGroup.selectAll('path.flow')
			.data(this.presenter.flows(), d => d.id);

		flows.enter()
			.append('path')
			.attr('class', 'flow');

		transition(flows
			.style('fill', 'none')
			.sort(function(a, b) {
				return (b.votes - a.votes)
			}))
			.attr('d', d => {
				let dist = d.geo.y1 - d.geo.y0;

				return 'M' +  d.geo.x0 + ',' + d.geo.y0
					+ ' C' + d.geo.x0 + ',' + (d.geo.y0 + dist/2)
					+ ' ' + d.geo.x1 + ',' + (d.geo.y1 - dist/2)
					+ ' ' + d.geo.x1 + ',' + d.geo.y1;

			})
			.style('stroke', d =>  d.from.data.color)
			.style('stroke-width', d => d.geo.width)
			.style('opacity', d => {
				if (!this.highlightRanking) {
					return 0.55;
				}

				if (d.from.votedFor && d.to.votedFor) {
					return 0.7
				} else {
					return 0.2;
				}
			});

		flows.exit().remove();
	}

	/**
	 * Updates the ranking of choices displayed/highlighted within the chart
	 * @param {array} ranking Array of keys/ids for the ranking, ordered from first choice down.
	 */
	updateRanking(ranking) {
		if (ranking.length === 0) {
			this.setHighlightRanking(false);
		} else if (!this.highlightRanking) {
			this.setHighlightRanking(true);
		}

		this.counts.forEach(count => {
			let eliminatedKey;

			count.totals.forEach((k,v) => {
				if (v.key === ranking[0]) {
					v.votedFor = true;
				} else {
					v.votedFor = false;
				}

				if (v.eliminated) {
					eliminatedKey = v.key;
				}
			});

			// remove the eliminated choice from the ranking

			let i = ranking.indexOf(eliminatedKey);

			if (i >= 0) {
				ranking.splice(i, 1);

				// Mark the vote as 'Non-transferable' if there are no rankings remaining
				if (ranking.length === 0) {
					ranking.push('nt');
				}
			}
		});

		this.render(TRANSITION_SPEED);
	}

	/**
	 * Sets whether the chart should highlight the ranking of the choices (as given to updateRanking)
	 * @param {boolean} highlight true to highlight the ranking, false otherwise.
	 */
	setHighlightRanking(highlight) {
		this.highlightRanking = highlight;
		this.highlightCheckbox.property('checked', highlight);
		this.render(TRANSITION_SPEED);
	}
}
