# Project-3 Using demographics and coffee shops to predict future housing prices
*By Kylie Tan, Quynh Nhu Bui, Michael Boese, and Bani Vafa*

APP URL: https://sleepy-badlands-55454.herokuapp.com/

The purpose of this project was to train a machine learning model with data we strategically collected in order to try to predict the future outcomes of a topic we felt passionate about.

With questions still left unanswered from a previous project (https://github.com/kylietan/Project-2) in which we visually investigated the potential connection between trendy coffee houses and gentrifying neighborhoods by overlaying the retail locations of six of the Bay Area's largest second and third wave coffee retailers over choropleth polygons representing the neighborhoods of San Francisco, color-weighted by median housing price, we decided to dig deeper into this relationship with the help of machine learning.

While conducting a literature review for our previous project, we came across a working paper titled "Nowcasting Gentrification: Using Yelp Data to Quantify Neighborhood Change", by Edward L. Glaeser, Hyunjin Kim, and Michael Luca of the Harvard School of Business (https://www.hbs.edu/faculty/Publication%20Files/18-077_a0e9e3c7-eceb-4685-8d72-21e0f518b3f3.pdf). In this paper, the authors investigated how data from an array of digital platforms "have the potential to improve our understanding of gentrification and enable new measures of how neighborhoods change in close to real time."


![Project 3 Map Screenshot](Project3/images/map_page.png)

Because we want to be able to expand on this app in the future in order to visualize larger, more complex datasets and be able to create some truly informative visualizations, we felt that our best option would be to host our app on Heroku so that we could take advantage of the free 10,000 rows of PostgreSQL database hosing they offer. Doing so has already allowed us to easily expand from a one layer visualization to an selectable 8-layer, responsive, information rich app that we hope to make even better with time.

Building our app to this point has occurred in three stages, the data collection stage, the database construction stage, and the front-end visualization stage.

The data we needed to create our visualization was polygon data for the geographic areas we wanted to display, housing data with which to weight those geographic area's choropleth colors with, and the locations of the stores belonging to the coffee purveyors we selected for this particular visualization. We collected this data by using the Google Places and Attom Data Solutions API's, Zillow's data archive, and a little web-scraping.

We cleaned our data using several Jupyter notebooks and uploaded our desired tables to our Heroku PostgreSQL database using SQLAlchemy, and in order to feed our Leaflet map the data we want to visualize, we use flask_sqlalchemy to query our database for the joined table data required by each component of our Leaflet framework. After receiving the data from the database, our flask app reassembles the data into a geoJSON's that are returned through the app's routes so that they can be easily read in by Leaflet. From there, the Leaflet script we've written handles the rest.

Below is a simple flowchart graphically explaining the way our app functions from front to back, and back to front.

![Project 3 App Flowchart](Project3/images/Project_3_Flowchart.png)
