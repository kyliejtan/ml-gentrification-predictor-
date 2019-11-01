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

let zipcodePolygonMap;

// Creating map object
let map = L.map("map", {
  center: [37.773972, -122.431297],
  zoom: 12,
  layers: [darkMap]
});

//create temp layer to store new features
let featureGroup = L.featureGroup().addTo(map)

let zipPolyLegend = L.control({ position: "bottomleft" });
let selectionLegend = L.control({ position: "bottomright"});

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
      + "</h6><h3>Percent age 25 - 34 :</h3>"
      + "<h6>" + Math.round(layer.pct_25_34) + "</h6>"
      + "</h6><h3>Percent with college degree :</h3>"
      + "<h6>" + Math.round(layer.pct_college_deg) + "</h6>"
      + "</h6><h3>Percent white :</h3>"
      + "<h6>" + Math.round(layer.pct_wht) + "</h6>"
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
// Creating a function that will build the map. A function is being created so
// that it can be called to update the map when the user submits values to the
// model
function mapBuilder(data) {
  // Building the choropleth layer
  zipcodePolygonMap = L.choropleth(data, {

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
    // Setting values and behaviors for each feature
    onEachFeature: function(feature, layer) {
      // Set mouse events to change map styling
      let zip_code = layer.feature.properties.name
      let pct_25_34 = Math.round(layer.feature.properties.pct_25_34)
      let pct_college_deg = Math.round(layer.feature.properties.pct_college_deg)
      let pct_wht = Math.round(layer.feature.properties.pct_wht)
      let num_coffee_shops = Math.round(layer.feature.properties.num_coffee_shops)
      let current_year_housing_price = Math.round(layer.feature.properties.current_year_housing_price)
      let newMarker
      // Setting mouse behaviors for each feature
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
          layer = event.target
          newMarker = new L.marker(event.latlng).addTo(map);
          let popLocation= event.latlng;
          let popupContent = '<div class="form-div">' + '<form role="form" id="form" enctype="multipart/form-data" class = "form-horizontal" onsubmit="action=/model method="POST" action="model">'+
                        '<div class="form-group">'+
                            '<label class="control-label col-sm-5"><strong>Zip code: </strong></label>'+
                            '<input type="number" min="0" value=' + '"' + zip_code + '"' + 'class="form-control" id="zip_code" name="zip_code">'+
                        '</div>'+
                        '<div class="form-group">'+
                            '<label class="control-label col-sm-5"><strong>Percent 25 - 34: </strong></label>'+
                            '<input type="number" min="0" value=' + '"' + pct_25_34 + '"' + 'class="form-control" id="pct_25_34" name="pct_25_34">'+
                        '</div>'+
                        '<div class="form-group">'+
                            '<label class="control-label col-sm-5"><strong>Percent college educated: </strong></label>'+
                            '<input type="number" min="0" value=' + '"' + pct_college_deg + '"' + 'class="form-control" id="pct_college_deg" name="pct_college_deg">'+
                        '</div>'+
                        '<div class="form-group">'+
                            '<label class="control-label col-sm-5"><strong>Percent white: </strong></label>'+
                            '<input type="number" min="0" value=' + '"' + pct_wht + '"' + 'class="form-control" id="pct_wht" name="pct_wht">'+
                        '</div>'+
                        '<div class="form-group">'+
                            '<label class="control-label col-sm-5"><strong>Number of coffee shops: </strong></label>'+
                            '<input type="number" min="0" value=' + '"' + num_coffee_shops + '"' + 'class="form-control" id="num_coffee_shops" name="num_coffee_shops">'+
                        '</div>'+
                        '<div class="form-group">'+
                            '<label class="control-label col-sm-5"><strong>Median housing price: </strong></label>'+
                            '<input type="number" min="0" value=' + '"' + current_year_housing_price + '"' + 'class="form-control" id="current_year_housing_price" name="current_year_housing_price">'+
                        '</div>'+
                        '<div class="form-group">'+
                          '<div style="text-align:center;" class="col-xs-4"><button type="submit" value="submit" class="btn btn-primary trigger-submit">Submit</button></div>'+
                        '</div>'+
                        '</form>' +
                        '</div>'
          newMarker.bindPopup(popupContent,{
                      keepInView: true,
                      closeButton: true,
                      minWidth: 300
                      }).openPopup();

          $(document).delegate('#form', 'submit', function (event) {
            newMarker.closePopup()
            map.setView([37.773972, -122.431297]);
            event.preventDefault();
            let pct_25_34 = $("#pct_25_34").val();
            let pct_college_deg = $("#pct_college_deg").val();
            let pct_wht = $("#pct_wht").val();
            let num_coffee_shops = $("#num_coffee_shops").val();
            let current_year_housing_price = $("#current_year_housing_price").val();
            let actionurl = event.currentTarget.action;
            console.log(actionurl);
            $.ajax({
              url: actionurl,
              type: 'POST',
              dataType: 'JSON',
              data: $("#form").serialize(),
              success: function (msg, status, jqXHR) {
                let modelPrediction = msg;
                console.log("POST request success");
                console.log(modelPrediction);
                mapBuilder(modelPrediction)
              },
              error: function (msg, status, jqXHR) {
                console.log("POST request failure");
              }
            });
          });
        }
      });
    }
  })
  zipcodePolygonMap.addTo(layers["ZIPCODE_POLYGONS"]);
  //
  zipPolyLegend.onAdd = function() {
    let limits = zipcodePolygonMap.options.limits;
    let colors = zipcodePolygonMap.options.colors;
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
  zipcodePolygonMap.addTo(map)
};
d3.json(`/base_polygons`, function(data) {
  // Create a new choropleth layer
  mapBuilder(data)
  //
});
//
let polygonOverlays = {"Zip Code Polygons": layers.ZIPCODE_POLYGONS};
L.control.layers(baseMaps).addTo(map);
