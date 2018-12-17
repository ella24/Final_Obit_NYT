import * as d3 from 'd3'

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num))
}

var margin = { left: 50, right: 50, top: 30, bottom: 30 }
var height = 400 - margin.top - margin.bottom
var width = 800 - margin.left - margin.right

// Add our SVG normally
var svg = d3
  .select('#chart-1')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`)

svg
  .append('rect')
  .attr('width', width)
  .attr('height', height)
  .attr('opacity', 0)

// Scales
var xPositionScale = d3
  .scaleLinear()
  .domain([1996, 2018])
  .range([0, width])
var yPositionScale = d3
  .scaleLinear()
  .domain([0, 1200])
  .range([height, 0])

// Line generator
var line = d3
  .line()
  .x(d => xPositionScale(d.year))
  .y(d => yPositionScale(d.count))

// This is the line where we guess
// .defined is "don't draw a line here until this has a value"
var guessLine = d3
  .line()
  .x(d => xPositionScale(d.year))
  .y(d => yPositionScale(d.guess))
  .defined(d => d.guess !== null)

// This is used to hide the initially-hidden part of the complete graph
// Whatever it covers, it shows
var clipper = svg
  .append('clipPath')
  .attr('id', 'clipper')
  .append('rect')
  .attr('width', width - 1)
  .attr('height', yPositionScale(400) + 1)

let guessPath = svg
  .append('path')
  .attr('class', 'guess-line')
  .attr('fill', 'none')
  .attr('stroke', '#fac532')
  .attr('stroke-width', 4)
  .attr('stroke-dasharray', '5 5')

var hiddenGroup = svg
  .append('g')
  .attr('id', 'finished')
  .attr('clip-path', 'url(#clipper)')

hiddenGroup
  .append('text')
  .text('MEN')
  .attr('text-anchor', 'middle')
  .attr('x', xPositionScale(2014))
  .attr('y', yPositionScale(800))
  .attr('fill', '#66c2a5')
  .attr('letter-spacing', 1.5)
  .attr('font-weight', 500)

hiddenGroup
  .append('text')
  .text('WOMEN')
  .attr('text-anchor', 'middle')
  .attr('x', xPositionScale(2014))
  .attr('y', yPositionScale(250))
  .attr('fill', '#fdae61')
  .attr('letter-spacing', 1.5)
  .attr('font-weight', 500)

Promise.all([
  d3.csv(require('./data/obit_male.csv')),
  d3.csv(require('./data/obit_female.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([male, female]) {
  // Draw men
  hiddenGroup
    .append('path')
    .attr('class', 'line')
    .attr('d', line(male))
    .attr('stroke', '#66c2a5')
    .attr('stroke-width', 5)
    .attr('fill', 'none')

  // Draw women
  hiddenGroup
    .append('path')
    .attr('class', 'line')
    .attr('d', line(female))
    .attr('stroke', '#fdae61')
    .attr('stroke-width', 5)
    .attr('fill', 'none')

  // Create that yellow box
  var drawData = female
    .sort((a, b) => a.year - b.year)
    .map(d => {
      return {
        year: d.year,
        count: d.count,
        guess: null
      }
    })

  svg
    .append('g')
    .lower()
    .selectAll('rect')
    .data(drawData.filter(d => d.year != 2018))
    .enter()
    .append('rect')
    .attr('class', 'highlighter')
    .attr('y', 0)
    .attr('x', d => xPositionScale(d.year))
    .attr('height', height)
    .attr('width', xPositionScale(2) - xPositionScale(1))
    .attr('fill', '#fff880')
    .attr('opacity', 0)

  var completed = false

  function selected() {
    if (completed) {
      // Are you done already? If yeah, I'm done
      return
    }
    // console.log('You are dragging or clicking')
    // console.log(drawData)
    var [mouseX, mouseY] = d3.mouse(this)

    // What is the year for our x position?
    var mouseYear = xPositionScale.invert(mouseX)
    var year = clamp(mouseYear, 1996, 2018)

    // What is the unemployment for our y position?
    var mouseCount = yPositionScale.invert(mouseY)
    var count = clamp(mouseCount, 0, yPositionScale.domain()[1])

    // console.log(year, unemployment)

    // Instead of bisect we're just finding the closest datapoint
    // to where we're at, then update its unemployment
    var index = d3.scan(drawData, (a, b) => {
      return Math.abs(a.year - year) - Math.abs(b.year - year)
    })
    var closest = drawData[index]
    closest.guess = count

    // Update our path with a new d
    guessPath.attr('d', guessLine(drawData))

    var missing = drawData.filter(d => d.guess === null)

    svg.selectAll('.highlighter').attr('opacity', (d, i) => {
      if (missing.length === 23) {
        return 0.5
      }
    })

    svg.selectAll('.highlighter').attr('opacity', (d, i) => {
      if (d.guess !== null && drawData[i + 1].guess !== null) {
        // if you have a guess AND the next datapoint
        // has a guess, don't draw the rectangle
        return 0
      } else {
        return 0.5
      }
    })

    if (missing.length === 0) {
      // console.log('You are done')
      completed = true
      guessPath.attr('stroke-dasharray', 'none')

      svg
        .append('text')
        .text('YOUR GUESS')
        .attr('class', 'guess-text')
        .attr('text-anchor', 'middle')
        .attr('x', xPositionScale(2014))
        .attr('y', yPositionScale(drawData[18].guess))
        // .attr('y', yPositionScale(drawData[10].guess))
        .attr('fill', '#fff880')
        .attr('letter-spacing', 1.5)
        .attr('font-weight', 500)
        .attr('dy', -10)

      // Extend the clipPath to show the rest of the graph
      // (whatever it covers, it shows)
      // and shove it a little further to the right to see
      // obama's final circle
      clipper
        .transition()
        .duration(750)
        .attr('height', height + 10)

      // console.log(drawData)
    }
  }

  var drag = d3.drag().on('drag', selected)

  svg.call(drag).on('click', selected)

  // X axis
  var xAxis = d3
    .axisBottom(xPositionScale)
    .tickValues([1996, 2000, 2004, 2008, 2012, 2016])
    .tickFormat(d => d)

  svg
    .append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)

  // Y axis
  var yAxis = d3.axisLeft(yPositionScale).ticks(5)

  svg
    .append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis)
}