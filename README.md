# [NZ Flag Referendum Interactive Graph](http://nathanielw.github.io/nz-flag-graph/)

A responsive, interactive visualisation showing how votes were distributed between each round of the first New Zealand flag referendum (which used an instant runoff voting system).

The visualisation is powered primarily by D3.js. The layout of the chart follows the [Reusable Charts approach](http://bost.ocks.org/mike/chart/), so the [stvChart.js](src/js/stvChart.js) file could probably be used for other similar data (it doesn't do anything fancy, so things like ties and proper STV (not just IRV) probably don't work). For flexibility, the actual drawing of the chart is handled separately.

Building should be as simple as `npm install` and `gulp serve`.

The main reason for making this was initially to practice making a custom, mobile-first chart with D3, although it grew into a chance to try out some different stuff in terms of my front-end process, using npm for deps (no Bower :smiley:), Browserify and a bit of ES2015.

## License

All code released under the MIT License (see LICENSE file).
Data (in `/src/js/data.json`) and flag images (`/src/resources/img/flags/`) are from [electionresults.govt.nz](http://www.electionresults.govt.nz/2015_flag_referendum1/results-by-count-report.html).
