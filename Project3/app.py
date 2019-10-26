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

app.config["SQLALCHEMY_DATABASE_URI"] = 'postgres://fammaobqzbflly:e32d1aa0abf664a50cae846d82c61500d67069725e2a0471e4a01b93f123a932@ec2-54-221-212-126.compute-1.amazonaws.com:5432/d4t5jnp7det55m'
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
# zipcode_neighborhoods = Base.classes.zipcode_neighborhoods
zipcode_polygons = Base.classes.zipcode_polygons
complete_ml_data = Base.classes.complete_ml_data
# neighborhood_polygons = Base.classes.neighborhood_polygons
# zipcode_polygons = Base.classes.zipcode_polygons
# high_end_coffee_shops = Base.classes.high_end_coffee_shops
# coffee_shops = Base.classes.coffee_shops
# zillow_housing_data = Base.classes.zillow_housing_data
# neighborhood_coffee_counts = Base.classes.neighborhood_coffee_counts
# neighborhood_median_prices = Base.classes.neighborhood_median_prices

# Initializing the index route so that when visited, the html template,
# index.html will be visited
@app.route("/")
def index():
    """Return the homepage."""
    print("works up till here")
    return render_template("index.html")

@app.route("/base_polygons")
def base_polygons():
    # Use Pandas to perform the sql query
    sel = [zipcode_polygons, zipcode_neighborhoods, complete_ml_data]
    stmt = db.session.query(*sel).\
       join(zipcode_neighborhoods, zipcode_polygons.features_properties_name == zipcode_neighborhoods.zip_code).\
       join(complete_ml_data, zipcode_neighborhoods.zip_code == complete_ml_data.zip_code).\
       filter(complete_ml_data.year == 2017).\
       statement
    df = pd.read_sql_query(stmt, db.session.bind).reset_index(drop=True)
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
        pct_wht = row[1][12]
        pct_25_34 = row[1][13]
        pct_college_deg = row[1][14]
        num_coffee_shops = row[1][15]
        current_year_housing_price = row[1][16]

        choropleth_geojson_list.append({'type': features_type, 'properties': {'name': features_properties_name,
                'current_year_housing_price': current_year_housing_price,
                'neighborhoods': neighborhoods,
                'num_coffee_shops': num_coffee_shops,
                'pct_wht': pct_wht,
                'pct_25_34': pct_25_34,
                'pct_college_deg': pct_college_deg,
                },
                'geometry': {'type': features_geometry_type, 'coordinates': [[features_geometry_coordinates]]}})
#
    choropleth_geojson_dict = {'type': 'FeatureCollection', 'features': choropleth_geojson_list}
    return jsonify(choropleth_geojson_dict)

if __name__ == "__main__":
    app.run()
