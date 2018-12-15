import * as d3 from 'd3'

var margin = { top: 100, right: 20, bottom: 60, left: 40 }
var width = 600 - margin.left - margin.right
var height = 200 - margin.top - margin.bottom

var xPositionScale = d3
  .scaleBand()
  .range([0, width])
  .padding(0.2)
// var yPositionScale = d3
//   .scaleLinear()
//   .domain([0, 150])
//   .range([height, 0])
var colorScale = d3.scaleOrdinal().range(['#66c2a5', '#fdae61'])

var svg = d3
  .select('#chart-2')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

d3.csv(require('./data/husband-wife.csv'))
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready(datapoints) {
  // var categories = datapoints.map(function(d) {
  //   return d.words
  // })
  xPositionScale.domain(['husband', 'wife'])

  // console.log(categories)
  // console.log(datapoints)

  // svg
  //   .append('g')
  //   .attr('class', 'bars')
  //   .selectAll('.bar')
  //   .data(datapoints)
  //   .enter()
  //   .append('rect')
  //   .attr('class', 'bar')
  //   .attr('x', d => xPositionScale(d.words))
  //   .attr('y', d => yPositionScale(d.mentions))
  //   .attr('width', xPositionScale.bandwidth())
  //   .attr('height', d => height - yPositionScale(d.mentions))
  //   .attr('fill', d => colorScale(d.words))
  //   .attr('opacity', 0.2)

  var columns = 10
  var padding = 0.1
  var boxSize = xPositionScale.bandwidth() / columns
  var boxes = []

  datapoints.forEach(d => {
    // console.log(d)
    var points = d3.range(d.mentions).map(i => {
      // console.log(i)
      return {
        index: i,
        category: d.words,
        row: Math.floor(i / columns),
        col: i % columns
      }
    })

    // console.log(points)
    boxes = boxes.concat(points)
  })
  // console.log(boxes)

  var radius = (boxSize * (1 - padding)) / 2

  svg
    .append('g')
    .selectAll('.element')
    .data(boxes)
    .enter()
    .append('circle')
    .attr('class', 'element')
    .attr('fill', d => colorScale(d.category))
    .attr('cx', d => Math.random() * width)
    .attr('cy', d => Math.random() * height)
    .attr('r', 0)
    .transition()
    .duration(d => Math.random() * 3000 + 500)
    .ease(d3.easeElastic)
    .attr('r', radius)
    .attr('cx', d => {
      var offset = xPositionScale(d.category)
      return boxSize * d.col + offset + radius
    })
    .attr('cy', d => {
      return height - boxSize * d.row - radius
    })

  // setTimeout(() => {
  //   svg
  //     .selectAll('.element')
  //     .transition()
  //     .duration(d => Math.random() * 1000)
  //     .attr('r', 0)
  //     .attr('cx', d => Math.random() * width)
  //     .attr('cy', d => Math.random() * height)
  // }, 5000)

  var xAxis = d3.axisBottom(xPositionScale).tickSize(0)
  svg
    .append('g')
    .attr('class', 'axis axis-x')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)
    .lower()
}