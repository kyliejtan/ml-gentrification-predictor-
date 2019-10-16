// Initialize all of the LayerGroups we'll be using
let layers = {
  STARBUCKS: new L.LayerGroup(),
  PEETS: new L.LayerGroup(),
  PHILZ: new L.LayerGroup(),
  BLUEBOTTLE: new L.LayerGroup(),
  RITUAL: new L.LayerGroup(),
  SIGHTGLASS: new L.LayerGroup(),
  NEIGHBORHOOD_POLYGONS: new L.LayerGroup(),
  ZIPCODE_POLYGONS: new L.LayerGroup()
};
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
  layers: [
    layers.STARBUCKS,
    layers.PEETS,
    layers.PHILZ,
    layers.BLUEBOTTLE,
    layers.RITUAL,
    layers.SIGHTGLASS,
    layers.ZIPCODE_POLYGONS,
    darkMap
  ]
});

let zipPolyLegend = L.control({ position: "bottomleft" });
let neighborhoodPolyLegend = L.control({ position: "bottomleft" });
let selectionLegend = L.control({ position: "bottomright"});

map.on('baselayerchange', function(eventLayer) {
  if (eventLayer.name === 'Neighborhood Polygons') {
    neighborhoodPolyLegend.addTo(map);
    map.removeControl(zipPolyLegend);
    }
  else if (eventLayer.name === 'Zip Code Polygons') {
    zipPolyLegend.addTo(map);
    map.removeControl(neighborhoodPolyLegend);
    }
});
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
      this._div.innerHTML = "<h2>" + layer.name + "</h2><hr><h3>House Price Increase (%): </h3><h6>"
      + Math.round(layer.HPPI) + "%</h6><h3>Neighborhoods: </h3>"
      for (let i = 0; i < layer.neighborhoods.length; i++) {
        this._div.innerHTML += "<h6>" + layer.neighborhoods[i] + "</h6>"
      }
      this._div.innerHTML += "<h3>Coffee Shops :</h3>"
      for (let i = 0; i < layer.coffee_shops.length; i++) {
        this._div.innerHTML += "<h6>" + layer.coffee_shops[i] + "</h6>"
      }
    }
    else {
      this._div.innerHTML = "<h2>" + layer.name + "</h2><hr><h3>Median House Price (USD): </h3><h6>$"
      + Math.round(layer.MHP) + "</h6><h3>Coffee Shops :</h3>"
      for (let i = 0; i < layer.coffee_shops.length; i++) {
        this._div.innerHTML += "<h6>" + layer.coffee_shops[i] + "</h6>"
      }
    }
  }
};

info.addTo(map);
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Grab data with d3
d3.json(`/zipcode_polygon_values`, function(data) {

  // Create a new choropleth layer
  zipcode_polygon_map = L.choropleth(data, {

    // Define what  property in the features to use
    valueProperty: "HPPI",

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
});
////////////////////////////////////////////////////////////////////////////////
// Grab data with d3
///////////////////////////////////////////////////////////////////////////////
d3.json(`/neighborhood_polygon_values`, function(data) {

  // Create a new choropleth layer
  neighborhood_polygon_map = L.choropleth(data, {

    // Define what  property in the features to use
    valueProperty: "MHP",

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
          updateSelectionLegend(layer)
          layer = event.target;
          layer.setStyle({
            fillOpacity: 1
          });
        },
        // When the cursor no longer hovers over a map feature - when the mouseout event occurs - the feature's opacity reverts back to 50%
        mouseout: function(event) {
          map.removeControl(selectionLegend);
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

  neighborhood_polygon_map.addTo(layers["NEIGHBORHOOD_POLYGONS"]);

  neighborhoodPolyLegend.onAdd = function() {
    let limits = neighborhood_polygon_map.options.limits;
    let colors = neighborhood_polygon_map.options.colors;
    let labels = [];

    // Add min & max
    let legendInfo = "<h3>Housing Price (USD)</h3>"
    let div = L.DomUtil.create("div", "info legend");
    div.innerHTML = ""
    div.innerHTML += legendInfo;

    for (let i = 0; i < colors.length; i++) {
      let first = Math.round(limits[i])
      let second = Math.round(limits[i + 1])
    	div.innerHTML +=
        '<i style="background:' + colors[i] + '"></i> ' +
        "$" + first + (second ? '&ndash;' + "$" + second + '<br>' : '+');
    	}

    return div;
  };
  // neighborhoodPolyLegend.addTo(map)
  // Adding legend to the map
  // neighborhoodPolyLegend.addTo(map);

});

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
let polygonOverlays = {
  "Neighborhood Polygons": layers.NEIGHBORHOOD_POLYGONS,
  "Zip Code Polygons": layers.ZIPCODE_POLYGONS
};

let overlays = {
  "Starbucks Coffee": layers.STARBUCKS,
  "Peets Coffee": layers.PEETS,
  "Philz Coffee": layers.PHILZ,
  "Blue Bottle Coffee": layers.BLUEBOTTLE,
  "Ritual Coffee": layers.RITUAL,
  "Sightglass Coffee": layers.SIGHTGLASS
};

L.control.layers(polygonOverlays).addTo(map);
L.control.layers(baseMaps, overlays).addTo(map);

let icons = {
  STARBUCKS: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/kylietan/Project-2/kylies_branch/Project2/icons/starbucks_logo.png",
    iconSize: [30, 30],
    popupAnchor: [-3,-76]
  }),
  PEETS: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/kylietan/Project-2/kylies_branch/Project2/icons/peets_logo.png",
    iconSize: [30, 30],
    popupAnchor: [-3,-76]
  }),
  PHILZ: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/kylietan/Project-2/kylies_branch/Project2/icons/philz_logo.png",
    iconSize: [40, 40],
    popupAnchor: [-3,-76]
  }),
  BLUEBOTTLE: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/kylietan/Project-2/kylies_branch/Project2/icons/blue_btl_logo.png",
    iconSize: [60, 60],
    popupAnchor: [-3,-76]
  }),

  RITUAL: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/kylietan/Project-2/kylies_branch/Project2/icons/ritual_logo.jpeg",
    iconSize: [30,30],
    popupAnchor: [-3, -76]
  }),

  SIGHTGLASS: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/kylietan/Project-2/kylies_branch/Project2/icons/sightglass_logo.png",
    iconSize: [30, 30],
    popupAnchor: [-3, -76]
  })
};

d3.json("/coffee_shop_locations", function(data) {

  let storeCount = {
    STARBUCKS: 0,
    PEETS: 0,
    PHILZ: 0,
    BLUEBOTTLE: 0,
    RITUAL: 0,
    SIGHTGLASS: 0
  };

  let storeName;
  data.forEach(function(element) {
    let store = element.name;

    if (store === "Starbucks") {
      storeName = "STARBUCKS";
    }
    else if (store === "Peets Coffee") {
      storeName = "PEETS";
    }
    else if (store === "Blue Bottle Coffee") {
      storeName = "BLUEBOTTLE";
    }

    else if (store === "Sightglass Coffee") {
      storeName = "SIGHTGLASS";
    }

    else if (store === "Ritual Coffee Roasters") {
      storeName = "RITUAL";
    }
    else {
      storeName = "PHILZ";
    }

    storeCount[storeName]++;

    let newMarker = L.marker(element.lat_lng, {
      icon: icons[storeName]
    });

    newMarker.addTo(layers[storeName]);
    newMarker.bindPopup("<h3>" + element.name + "</h3><hr><h3>" + element.address + "</h3>");
  });
});
