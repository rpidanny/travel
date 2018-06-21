var chartDiv = document.getElementById("chart");
var canvas = d3.select(chartDiv).append("canvas");

function reDraw() {
  var width = chartDiv.clientWidth;
  var height = chartDiv.clientHeight;
  console.log(width, height);
  var projection = d3.geo.orthographic()
    .translate([width / 2, height / 2])
    .scale(width > height ? (width / height) * 100 : (height / width) * 100)
    .clipAngle(90)
    .precision(0.6);

  canvas
    .attr("width", width)
    .attr("height", height);

  var c = canvas.node().getContext("2d");

  var path = d3.geo.path()
    .projection(projection)
    .context(c);

  var title = d3.select("h1");

  queue()
    .defer(d3.json, "data/world-map.json")
    .defer(d3.tsv, "data/countries-visited.tsv")
    .await(ready);

  function ready(error, world, names) {
    if (error) throw error;

    var globe = {
        type: "Sphere"
      },
      land = topojson.feature(world, world.objects.land),
      countries = topojson.feature(world, world.objects.countries).features,
      borders = topojson.mesh(world, world.objects.countries, function (a, b) {
        return a !== b;
      }),
      i = -1,
      n = names.length;

    countries = countries.filter(function (d) {
      return names.some(function (n) {
        if (d.id == n.id) return d.name = n.name;
      });
    }).sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

    (function transition() {
      d3.transition()
        .duration(700)
        .each("start", function () {
          title.text(countries[i = (i + 1) % n].name);
        })
        .tween("rotate", function () {
          var p = d3.geo.centroid(countries[i]),
            r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
          return function (t) {
            projection.rotate(r(t));
            c.clearRect(0, 0, width, height);
            c.fillStyle = "#8cbed6", c.lineWidth = 2, c.beginPath(), path(globe), c.fill();
            c.fillStyle = "#fee8c8", c.beginPath(), path(land), c.fill();
            c.fillStyle = "#e6550d", c.beginPath(), path(countries[i]), c.fill();
            c.strokeStyle = "#222", c.lineWidth = .5, c.beginPath(), path(borders), c.stroke();
            c.strokeStyle = "#8cbed6", c.lineWidth = 2, c.beginPath(), path(globe), c.stroke();
          };
        })
        .transition()
        .each("end", transition);
    })();
  }

  d3.select(self.frameElement).style("height", height + "px");
}

reDraw();
window.addEventListener("resize", reDraw);