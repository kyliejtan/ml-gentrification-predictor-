# Importing dependencies
import joblib
import json
import os
import pandas as pd
import numpy as np
import psycopg2
import sqlalchemy
from boto.s3.connection import S3Connection
from flask import Flask, jsonify, render_template, flash, request, url_for, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField
from wtforms.validators import DataRequired
from sklearn.linear_model import LinearRegression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, extract, func, inspect
from sqlalchemy import Column, Integer, Float, Date

class modelForm(FlaskForm):
    pct_25_34 = StringField('pct_25_34', validators=[DataRequired()])
    pct_college_deg = StringField('pct_college_deg', validators=[DataRequired()])
    pct_wht = StringField('pct_wht', validators=[DataRequired()])
    num_coffee_shops = StringField('num_coffee_shops', validators=[DataRequired()])
    current_year_housing_price = StringField('current_year_housing_price', validators=[DataRequired()])


app = Flask(__name__)
# model = joblib.load("models/without_hist_scaled_model.pkl")

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
zipcode_neighborhoods = Base.classes.zipcode_neighborhoods
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

        choropleth_geojson_list.append({'type': features_type,
            'geometry': {'type': features_geometry_type, 'coordinates': [[features_geometry_coordinates]]},
                'properties': {'name': features_properties_name,
                'current_year_housing_price': current_year_housing_price,
                'neighborhoods': neighborhoods,
                'num_coffee_shops': num_coffee_shops,
                'pct_wht': pct_wht,
                'pct_25_34': pct_25_34,
                'pct_college_deg': pct_college_deg,
                }})

#
    choropleth_geojson_dict = {'type': 'FeatureCollection', 'features': choropleth_geojson_list}
    return jsonify(choropleth_geojson_dict)

@app.route('/model', methods=["GET", "POST"])
def predict():
    model = joblib.load('../models/without_hist_scaled_model.pkl')
    error = None
    if request.method == 'POST':
        user_input =  request.form
        pct_25_34 = float(request.form['pct_25_34'])
        pct_college_deg = float(request.form['pct_college_deg'])
        pct_wht = float(request.form['pct_wht'])
        num_coffee_shops = float(request.form['num_coffee_shops'])
        current_year_housing_price = float(request.form['current_year_housing_price'])
        print("POST request successful")
        print(type(pct_25_34))

    else:
        error = 'Invalid Credentials. Please try again.'
        print("POST request failure")

    if model:
        print("Model loaded")
    else:
        print("Model load failed")

    input_array = np.array([pct_25_34, pct_college_deg, pct_wht, current_year_housing_price, num_coffee_shops])
    prediction = model.predict(input_array.reshape(1, -1))

    print(prediction)

    return prediction


if __name__ == "__main__":
    app.run()
