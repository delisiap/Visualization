/*global d3*/

let initHeatMap = function(data, labelRow, labelCol, labelColCount){
	
	const COLORS = getGlobalConstants().COLORS;	
	
	//Initialize the dimensions for the graph
	let margin = {
		top: 50,
		right: 0,
		bottom: 100,
		left: 130
	},
	width = 600 - margin.left - margin.right,
	height = 500 - margin.top - margin.bottom,
	gridSize = Math.floor(width / 24),
	legendElementWidth = gridSize * 2;

	let svg = d3.select("#heatmap")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform",
			"translate(" + margin.left + "," + margin.top + ")");

	//Initialize the color scale
	let colorScale = d3.scaleQuantile()
		.domain([0, COLORS.length - 1, d3.max(data, function (d) {
					return d.items.length;
				})])
		.range(COLORS);

	// Build X scale and axis:
	let x = d3.scaleBand()
		.range([0, width])
		.domain(labelRow)
		.padding(0.05);
		
	// Build X scale and axis for the top count:	
	let xTop = d3.scaleBand()
		.range([0, width])
		.domain(labelColCount)
		.padding(0.05);
	
	// Build Y scales and axis:	
	let y = d3.scaleBand()
		.range([height, 0])
		.domain(labelCol)
		.padding(0.05);
		
	svg.append("g")
	.attr("class", "chartLabel")
	.attr("transform", "translate(0," + height + ")")
	.call(d3.axisBottom(x).tickSize(0))
	.select(".domain").remove();

	svg.append("g")
	.attr("class", "chartLabel")
	.call(d3.axisTop(xTop).tickSize(0))
	.select(".domain").remove();

	svg.append("g")
	.attr("class", "chartLabel")
	.call(d3.axisLeft(y).tickSize(0))
	.select(".domain").remove();

	// Create a tooltip
	let tooltip = d3.select("#heatmap")
		.append("div")
		.attr("class", "tooltip")
		.attr("id","tooltipHeatmap");

	/* mouseover, mousemove, mouseleave 
	handles the tooltip when the mouse is moved over each rectangle
	*/
	let mouseover = function () {
		tooltip
		.style("display", "block");
		
		d3.select(this)
		.style("stroke", "black");
	}
		
	let mousemove = function (d) {
		tooltip
		.html(
		`<div>
			<span class='label'>Flight count: </span>
			<span>${d.items.length}</span>
		</div>
		 <div>
			<span class='label'>Airline: </span>
			<span>${d.airlineDesc}</span>
		</div>
		<div>
			<span class='label'>Day of week: </span>
			<span>${d.dayOfWeekDesc}</span>
		</div>
		`)
		.style("left", (d3.mouse(this)[0] ) + "px")
		.style("top", (d3.mouse(this)[1]) + "px");
	};

	let mouseleave = function () {
		tooltip
		.style("display", "none");
		
		d3.select(this)
		.style("stroke", "none");
	};

	// Add the squares
	svg.selectAll()
	.data(data)
	.enter()
	.append("rect")
	.attr("x", function (d) {
		return x(d.dayOfWeekDesc)
	})
	.attr("y", function (d) {
		return y(d.airlineDesc)
	})
	.attr("rx", 4)
	.attr("ry", 4)
	.attr("width", x.bandwidth())
	.attr("height", y.bandwidth())
	.style("fill", function (d) {
		return colorScale(d.items.length)
	})
	.style("stroke", "none")
	.on("mouseover", mouseover)
	.on("mousemove", mousemove)
	.on("mouseleave", mouseleave);

	//Build the legend
	let legend = svg.selectAll(".legend")
		.data([0].concat(colorScale.quantiles()), function (d) {
			return d;
		})
		.enter().append("g")
		.attr("class", "legend");

	legend
	.append("rect")
	.attr("x", function (d, i) {
		return legendElementWidth * i;
	})
	.attr("y", height + margin.top)
	.attr("width", legendElementWidth)
	.attr("height", gridSize)
	.style("fill", function (d, i) {
		return COLORS[i];
	})

	legend
	.append("text")
	.attr("class", "mono")
	.text(function (d) {
		return "≥" + Math.round(d);
	})
	.attr("x", function (d, i) {
		return legendElementWidth * i;
	})
	.attr("y", height + gridSize * 2 + margin.top);

	legend.exit().remove();	
}

let renderHeatmap = function(){

	let dictionary_aircarrier = [];
	let finalDataSet = [];
	let labelColCount = [];

	const DAYOFWEEKMAPPING = getGlobalConstants().DAYOFWEEKMAPPING;
	const AIRLINEMAPPING = getGlobalConstants().AIRLINEMAPPING;

	d3.csv("flights_2015_sample.csv")
	.row((rowData) => {
		
		let dayOfWeek = rowData["DAY_OF_WEEK"];
		let airline = rowData["AIRLINE"];

		let key = airline + "_" + dayOfWeek;
		let index = dictionary_aircarrier.indexOf(key);
		
		if (index === -1) {	
			index = finalDataSet.length;
			dictionary_aircarrier.push(key);

			finalDataSet.push({
				dayOfWeekCode: dayOfWeek,
				dayOfWeekDesc: DAYOFWEEKMAPPING[dayOfWeek] || dayOfWeek,
				airlineCode: airline,
				airlineDesc: AIRLINEMAPPING[airline] || airline,
				items: [],
			});
			
		} 
		
		finalDataSet[index].items.push(rowData);
		
		if (!labelColCount[dayOfWeek-1]) {
			labelColCount[dayOfWeek-1] = 0;
		}

		labelColCount[dayOfWeek-1] += 1;

		return finalDataSet;
	})
	.get(() => {
		
		//sort the dataset 
		finalDataSet.sort(function (a, b) {
			return a["dayOfWeekCode"] - b["dayOfWeekCode"];
		});
		
		let labelRow = [];
		let labelCol = [];
		
		d3.map(finalDataSet, function (d) {
			
			if(labelRow.indexOf(d.dayOfWeekDesc)==-1){
				labelRow.push(d.dayOfWeekDesc)
			}
			
			if(labelCol.indexOf(d.airlineDesc)==-1){
				labelCol.push(d.airlineDesc)
			}	
		});
			
		initHeatMap(finalDataSet, labelRow, labelCol, labelColCount);
	});
}
