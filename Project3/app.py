# Importing dependencies
import os
import pandas as pd
import numpy as np
import psycopg2
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, extract, func, inspect
from sqlalchemy import Column, Integer, Float, Date
from flask import Flask, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from boto.s3.connection import S3Connection

app = Flask(__name__)

#################################################
# Database Setup
#################################################
# Establishing the connection between the app and the bellybutton database
db_uri = os.environ.get('DATABASE_URL')
api_key = os.environ.get('API_KEY')

app.config["SQLALCHEMY_DATABASE_URI"] = 'postgres://gaoafzhoycjoin:3e7bfe74080d2238fa6ef14ee67e403af421b3d7d5cb45f12aa5df5fdbf1968b@ec2-174-129-43-40.compute-1.amazonaws.com:5432/dfu7vggjmve1rn'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# # Binding the instance of flask_sqlalchemy.SQLAlchemy to this specific flask app
db = SQLAlchemy(app)
# Initializing a variable with the created engine
engine = db.engine
# Initializing a variable with the connection resource
connection = engine.connect()
session = Session(engine)
inspector = inspect(engine)
# # reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(db.engine, reflect=True)
#
# # Save references to each table
zipcode_neighborhoods = Base.classes.zipcode_neighborhoods
zipcode_polygons = Base.classes.zipcode_polygons
neighborhood_polygons = Base.classes.neighborhood_polygons
zipcode_polygons = Base.classes.zipcode_polygons
high_end_coffee_shops = Base.classes.high_end_coffee_shops
coffee_shops = Base.classes.coffee_shops
zillow_housing_data = Base.classes.zillow_housing_data
neighborhood_coffee_counts = Base.classes.neighborhood_coffee_counts
neighborhood_median_prices = Base.classes.neighborhood_median_prices

# Initializing the index route so that when visited, the html template,
# index.html will be visited
@app.route("/")
def index():
    """Return the homepage."""
    print("works up till here")
    return render_template("index.html")

@app.route("/neighborhood_polygon_values")
def neighborhood_polygon_values():
    """Return a list of choropleth polygon weighting values."""

    # Use Pandas to perform the sql query
    sel = [neighborhood_polygons, neighborhood_median_prices.price, neighborhood_coffee_counts.coffee_shops]
    stmt = db.session.query(*sel).\
                join(neighborhood_median_prices, neighborhood_polygons.features_properties_name
                      == neighborhood_median_prices.neighborhood_name).\
                join(neighborhood_coffee_counts, neighborhood_coffee_counts.neighborhood_name == neighborhood_median_prices.neighborhood_name).statement
    df = pd.read_sql_query(stmt, db.session.bind)

    # Building a JSON file out of neighborhood_mortgage_rate_df
    choropleth_geojson_list = []
    # Using a for loop to build each geojson feature
    for row in df.iterrows():
        features_type = row[1][1]
        features_properties_link = row[1][2]
        features_properties_name = row[1][3]
        features_geometry_type = row[1][4]
        features_geometry_coordinates = row[1][5]
        features_properties_median_price = row[1][6]
        features_properties_coffee_shops = row[1][7]

        #
        choropleth_geojson_list.append({'type': features_type, 'properties': {'link': features_properties_link, 'name': features_properties_name,
              'MHP': features_properties_median_price, 'coffee_shops': features_properties_coffee_shops},
              'geometry': {'type': features_geometry_type, 'coordinates': [[features_geometry_coordinates]]}})
#
    choropleth_geojson_dict = {'type': 'FeatureCollection', 'features': choropleth_geojson_list}

    return jsonify(choropleth_geojson_dict)

@app.route("/zipcode_polygon_values")
def zipcode_polygon_values():
    """Return a list of choropleth polygon weighting values."""

    # Use Pandas to perform the sql query
    sel = [zipcode_polygons, zipcode_neighborhoods, zillow_housing_data.zipcode, zillow_housing_data.price_96,
           zillow_housing_data.price_14, zillow_housing_data.price_19]
    stmt = db.session.query(*sel).\
                join(zipcode_neighborhoods, zipcode_polygons.features_properties_name == zipcode_neighborhoods.zipcode).\
                join(zillow_housing_data, zipcode_neighborhoods.zipcode == zillow_housing_data.zipcode).statement
    df = pd.read_sql_query(stmt, db.session.bind)

    # Building a JSON file out of neighborhood_mortgage_rate_df
    choropleth_geojson_list = []
    # Using a for loop to build each geojson feature
    for row in df.iterrows():
        id = row[1][0]
        features_type = row[1][1]
        features_properties_name = row[1][2]
        features_geometry_type = row[1][3]
        features_geometry_coordinates = row[1][4]
        neighborhoods = row[1][6]
        coffee_shops = row[1][7]
        price_96 = row[1][9]
        price_14 = row[1][10]
        price_19 = row[1][11]
        if features_properties_name == '94111':
            features_properties_rate_of_increase = ((price_19 - price_14) * 100)/price_14
        else:
            features_properties_rate_of_increase = ((price_19 - price_96) * 100)/price_96


        choropleth_geojson_list.append({'type': features_type, 'properties': {'name': features_properties_name,
                'HPPI': features_properties_rate_of_increase, 'neighborhoods': neighborhoods, 'coffee_shops': coffee_shops},
                'geometry': {'type': features_geometry_type, 'coordinates': [[features_geometry_coordinates]]}})
#
    choropleth_geojson_dict = {'type': 'FeatureCollection', 'features': choropleth_geojson_list}

    return jsonify(choropleth_geojson_dict)

@app.route("/coffee_shop_locations")
def coffee_shop_locations():
    stmt = db.session.query("* FROM coffee_shops;").statement
    df = pd.read_sql_query(stmt, db.session.bind)
    return jsonify(df.to_dict(orient = "records"))

if __name__ == "__main__":
    app.run()
