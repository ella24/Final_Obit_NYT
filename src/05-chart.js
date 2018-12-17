import * as d3 from 'd3'

var margin = { top: 5, left: 20, right: 20, bottom: 60 }

var height = 150 - margin.top - margin.bottom

var width = 180 - margin.left - margin.right

var container = d3.select('#chart-5')
// .append('svg')
// .attr('height', height + margin.top + margin.bottom)
// .attr('width', width + margin.left + margin.right)
// .append('g')
// .attr('transform', `translate(${margin.left},${margin.top})`)

var pie = d3.pie().value(function(d) {
  return d.amount
})

var radius = 60

var arc = d3
  .arc()
  .innerRadius(0)
  .outerRadius(radius)

var xPositionScale = d3.scalePoint().range([0, width])

var colorScale = d3.scaleOrdinal().range(['#66c2a5', '#fdae61'])

d3.csv(require('./data/prof_list.csv'))
  .then(ready)
  .catch(err => {
    console.log('Failed with', err)
  })

function ready(datapoints) {
  var nested = d3
    .nest()
    .key(d => d.profession)
    .entries(datapoints)
  var professions = datapoints.map(d => d.profession)

  // console.log(nested)

  xPositionScale.domain(professions)

  container
    .selectAll('.small-charts')
    .data(nested)
    .enter()
    .append('svg')
    .attr('class', 'small-charts')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.left + margin.right)
    .append('g')
    .attr('transform', 'translate(62,62)')
    .each(function(d) {
      var svg = d3.select(this)

      // console.log(this)
      svg
        .selectAll('path')
        .data(pie(d.values))
        .enter()
        .append('path')
        .attr('d', d => arc(d))
        .attr('fill', d => colorScale(d.data.gender))

      svg
        .selectAll('.text-label')
        .data(d.values)
        .enter()
        .append('text')
        .attr('class', 'text-label')
        .attr('class', 'text-label')
        .text(function(d) {
          return d.profession
        })
        .attr('x', 0)
        .attr('y', 80)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')

      var div = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')

      svg
        .append('circle')
        .attr('r', radius)
        .attr('fill', 'white')
        .attr('opacity', 0.001)
        .on('mouseover', function(d) {
          div
            .transition()
            .duration(200)
            .style('opacity', 0.9)
          div
            .html(
              d.values[0].gender +
                ':' + ' ' +
                d.values[0].amount +
                '</br>' +
                d.values[1].gender +
                ':' + ' ' +
                d.values[1].amount
            )
            .style('left', d3.event.pageX + 'px')
            .style('top', d3.event.pageY + 'px')
            .style('background-color', 'black')
            .style('text-align', 'middle')
        })
        .on('mouseout', function(d) {
          div
            .transition()
            .duration(500)
            .style('opacity', 0)
        })
    })
}