
let initBoxPlot = function (sumstat, domain) {

	// set the dimensions and margins of the graph
	let margin = {
		top: 10,
		right: 30,
		bottom: 70,
		left: 40
	},
	width = 960 - margin.left - margin.right,
	height = 500 - margin.top - margin.bottom
		boxWidth = 30;

	// append the svg object to the #boxplot of the page
	let svg = d3.select("#boxplot")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform",
			"translate(" + margin.left + "," + margin.top + ")");

	// Initialize the X scale
	let x = d3.scaleBand()
		.range([0, width])
		.domain(domain["labels"])
		.paddingInner(1)
		.paddingOuter(.5);

	// Initialize the Y scale
	let y = d3.scaleLinear()
		.domain([domain.min, domain.max])
		.range([height, 0]);

	//Show the X scale
	svg
	.append("g")
	.attr("transform", "translate(0," + height + ")")
	.attr("class", "boxPlotLabel")
	.call(d3.axisBottom(x));

	//Show the Y scale
	svg
	.append("g")
	.call(d3.axisLeft(y));

	//Show the main vertical line
	svg
	.selectAll("vertLines")
	.data(sumstat)
	.enter()
	.append("line")
	.attr("x1", function (d) {
		return (x(d.key))
	})
	.attr("x2", function (d) {
		return (x(d.key))
	})
	.attr("y1", function (d) {
		return (y(d.value.min))
	})
	.attr("y2", function (d) {
		return (y(d.value.max))
	})
	.attr("stroke", "black")

	let tooltip = d3.select("#boxplot")
		.append("div")
		.attr("class", "tooltip");

	let mouseover = function (d) {
		tooltip
		.style("display", "block");
	}

	let mousemove = function (d) {
		tooltip
		.html(
			"<div><span class='label'>" + d.key + "</span><span></span></div>"
			 + "<hr>"
			 + "<div><span class='label'>Max: </span><span>" + d3.format(".2f")(d.value.max) + "</span></div>"
			 + "<div><span class='label'>Q3: </span><span>" + d3.format(".2f")(d.value.q3) + "</span></div>"
			 + "<div><span class='label'>Median: </span><span>" + d3.format(".2f")(d.value.median) + "</span></div>"
			 + "<div><span class='label'>Q1: </span><span>" + d3.format(".2f")(d.value.q1) + "</span></div>"
			 + "<div><span class='label'>Min: </span><span>" + d3.format(".2f")(d.value.min) + "</span></div>")
		.style("left", (d3.mouse(this)[0])  + "px")
		.style("top", (d3.mouse(this)[1]) + 570 + "px");
	};

	let mouseleave = function (d) {
		tooltip
		.style("display", "none");
	};

	// Show the rectangle for the main box

	svg
	.selectAll("boxes")
	.data(sumstat)
	.enter()
	.append("rect")
	.attr("x", function (d) {
		return (x(d.key) - boxWidth / 2);
	})
	.attr("y", function (d) {
		return (y(d.value.q3));
	})
	.attr("height", function (d) {
		return (y(d.value.q1) - y(d.value.q3));
	})
	.attr("width", boxWidth)
	.attr("stroke", "#253494")
	.style("fill", "#41b6c4")
	.on("mouseover", mouseover)
	.on("mousemove", mousemove)
	.on("mouseleave", mouseleave);

	// Show the median
	svg
	.selectAll("medianLines")
	.data(sumstat)
	.enter()
	.append("line")
	.attr("x1", function (d) {
		return (x(d.key) - boxWidth / 2);
	})
	.attr("x2", function (d) {
		return (x(d.key) + boxWidth / 2);
	})
	.attr("y1", function (d) {
		return (y(d.value.median));
	})
	.attr("y2", function (d) {
		return (y(d.value.median));
	})
	.attr("stroke", "black");

};

let renderBoxplot = function () {

	const AIRLINEMAPPING = getGlobalConstants().AIRLINEMAPPING;

	let domain = {
		min: null,
		max: null,
		labels: [],
	};

	d3.csv("flights_2015_sample.csv")
	.row((rowData) => {
		if (rowData["AIR_TIME"] === "") {
			return;
		}
		let label = AIRLINEMAPPING[rowData["AIRLINE"]] || rowData["AIRLINE"];

		if (domain.labels.indexOf(label) === -1) {
			domain.labels.push(label);
		}

		//Calculate speed based in distance and air time
		rowData["SPEED"] = rowData["DISTANCE"] / rowData["AIR_TIME"];
		rowData["AIRLINE_DESC"] = label;

		if (domain.min === null || domain.max === null) {
			domain.min = rowData["SPEED"];
			domain.max = rowData["SPEED"];
		}

		if (domain.min > rowData["SPEED"]) {
			domain.min = rowData["SPEED"];
		} else if (domain.max < rowData["SPEED"]) {
			domain.max = rowData["SPEED"];
		}
		return rowData;

	})
	.get((data) => {

		let q1,
		median,
		q3,
		interQuantileRange,
		min,
		max;

		// Compute quartiles, median, inter quantile range min and max which will then be used to draw the box.
		// Using nest group the calculation per level of a factor
		let sumstat = d3.nest()
			.key(function (d) {
				return d.AIRLINE_DESC;
			})
			.rollup(function (d) {
				q1 = d3.quantile(d.map(function (g) {
							return g.SPEED;
						}).sort(d3.ascending), .25);
				median = d3.quantile(d.map(function (g) {
							return g.SPEED;
						}).sort(d3.ascending), .5);
				q3 = d3.quantile(d.map(function (g) {
							return g.SPEED;
						}).sort(d3.ascending), .75);
				interQuantileRange = q3 - q1;
				min = q1 - 1.5 * interQuantileRange;
				max = q3 + 1.5 * interQuantileRange;
				return ({
					q1: q1,
					median: median,
					q3: q3,
					interQuantileRange: interQuantileRange,
					min: min,
					max: max,
				});
			})
			.entries(data);

		initBoxPlot(sumstat, domain);

	});
};
