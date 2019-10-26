// Initialize all of the LayerGroups we'll be using
let layers = {ZIPCODE_POLYGONS: new L.LayerGroup()};
// Define streetmap and darkmap layers
let streetMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 18,
  id: "mapbox.streets",
  accessToken: API_KEY
});
let darkMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 18,
  id: "mapbox.dark",
  accessToken: API_KEY
});
// Define a baseMaps object to hold our base layers
let baseMaps = {
  "Street Map": streetMap,
  "Dark Map": darkMap
};

let zipcode_polygon_map;

// Creating map object
let map = L.map("map", {
  center: [37.773972, -122.431297],
  zoom: 12,
  layers: [darkMap]
});

let zipPolyLegend = L.control({ position: "bottomleft" });
let selectionLegend = L.control({ position: "bottomright"});

// map.on('baselayerchange', function(eventLayer) {
//   if (eventLayer.name === 'Neighborhood Polygons') {
//     neighborhoodPolyLegend.addTo(map);
//     map.removeControl(zipPolyLegend);
//     }
//   else if (eventLayer.name === 'Zip Code Polygons') {
//     zipPolyLegend.addTo(map);
//     map.removeControl(neighborhoodPolyLegend);
//     }
// });
///
function updateSelectionLegend(layer) {
  info.update(layer.feature.properties);
};

let info = L.control({ position: "bottomright" });

info.onAdd = function() {
  this._div = L.DomUtil.create('div', 'info');
  this.update();
  return this._div;
};

info.update = function(layer) {
  if (layer) {
    if (layer.neighborhoods) {
      this._div.innerHTML = "<h2>"
      + layer.name
      + "</h2><hr><h3>Median House Price (USD): </h3><h6>$"
      + Math.round(layer.current_year_housing_price)
      + "</h6><h3>Coffee Shops :</h3>"
      + "<h6>" + layer.num_coffee_shops + "</h6>"
      + "</h6><h3>Neighborhoods: </h3>"
      for (let i = 0; i < layer.neighborhoods.length; i++) {
        this._div.innerHTML += "<h6>" + layer.neighborhoods[i] + "</h6>"
      }
      }
    }
};

info.addTo(map);
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Grab data with d3
d3.json(`/base_polygons`, function(data) {
  console.log(data);
  // Create a new choropleth layer
  zipcode_polygon_map = L.choropleth(data, {

    // Define what  property in the features to use
    valueProperty: "current_year_housing_price",

    // Set color scale
    scale: ["#ffffb2", "#b10026"],

    // Number of breaks in step range
    steps: 10,

    // q for quartile, e for equidistant, k for k-means
    mode: "q",
    style: {
      // Border color
      color: "#fff",
      weight: 1,
      fillOpacity: 0.8
    },

    onEachFeature: function(feature, layer) {
      // Set mouse events to change map styling
      layer.on({
        // When a user's mouse touches a map feature, the mouseover event calls this function, that feature's opacity changes to 90% so that it stands out
        mouseover: function(event) {
          layer = event.target;
          updateSelectionLegend(layer)
          layer.setStyle({
            fillOpacity: 1
          });
        },
        // When the cursor no longer hovers over a map feature - when the mouseout event occurs - the feature's opacity reverts back to 50%
        mouseout: function(event) {
          layer = event.target;
          layer.setStyle({
            fillOpacity: 0.8
          });
        },
        // When a feature (neighborhood) is clicked, it is enlarged to fit the screen
        click: function(event) {
          let lat_lng = map.mouseEventToLatLng(event.originalEvent);
          map.flyTo([lat_lng.lat, lat_lng.lng], 15);
        }
      });
    }
  })
  //
  zipcode_polygon_map.addTo(layers["ZIPCODE_POLYGONS"]);
  //
  zipPolyLegend.onAdd = function() {
    let limits = zipcode_polygon_map.options.limits;
    let colors = zipcode_polygon_map.options.colors;
    let labels = [];

    // Add min & max
    let legendInfo = "<h3>Change in <br> housing price (%)</h3>"
    let div = L.DomUtil.create("div", "info legend");
    div.innerHTML = ""
    div.innerHTML += legendInfo;

    for (let i = 0; i < colors.length; i++) {
      let first = Math.round(limits[i])
      let second = Math.round(limits[i + 1])
    	div.innerHTML +=
        '<i style="background:' + colors[i] + '"></i> ' +
        first + (second ? '&ndash;' + second + '<br>' : '+');
    	}

    return div;
  };
  // Adding legend to the map
  zipPolyLegend.addTo(map);
  zipcode_polygon_map.addTo(map)
});

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
let polygonOverlays = {"Zip Code Polygons": layers.ZIPCODE_POLYGONS};


L.control.layers(baseMaps).addTo(map);
