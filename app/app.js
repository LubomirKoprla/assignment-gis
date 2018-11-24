const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express()
let pg = require('pg');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true, strict: false }));
app.set('view engine', 'ejs');
var jsonParser = bodyParser.json({ type: 'application/json'});
let client = new pg.Client({
	user: 'pdt',
	host: 'localhost',
	database: 'postgis',
	password: 'pdt',
	port: 5432
});

(async function () {
	await client.connect();
})();

let query = "	SELECT \
					name, 	\
					osm_id, \
					ST_AsGeoJSON(ST_Centroid(ST_Transform(way, 4326))) as centroid	\
				FROM (	\
					SELECT 	\
						cities.name as name,	\
						cities.way as way, 	\
						cities.osm_id as osm_id, \
						SUM(ST_Area(polygons.way))/ST_Area(cities.way) as nature_perc 	\
					FROM 	\
						planet_osm_polygon polygons 	\
					JOIN (	\
						SELECT DISTINCT name,way,osm_id 	\
						FROM planet_osm_polygon 	\
						WHERE boundary='administrative' AND admin_level='9' AND name IS NOT NULL) as cities	\
					ON ST_Contains(cities.way,polygons.way) WHERE polygons.natural IS NOT NULL	\
					GROUP BY 1,2,3	\
					ORDER BY 4 DESC	\
					LIMIT 10) as result"
app.get('/', async function (req, res) {
	try {
		let result = await client.query(query);
		var results_json = {};
		var i;
		for(i = 0; i < result.rows.length; ++i) {
			results_json[i] = {
				x : JSON.parse(result.rows[i].centroid).coordinates[0],
				y : JSON.parse(result.rows[i].centroid).coordinates[1],
				name : result.rows[i].name,
				osm_id : result.rows[i].osm_id
			};
		}
		res.render('index', {greencities: results_json});
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

var query_buildpercent = "	SELECT SUM(ST_Area(ST_Intersection(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1),4326),3857),way)))/				\
								   ST_Area(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1),4326),3857))*100	AS result 							\
							FROM planet_osm_polygon osm 																						\
							WHERE ST_Intersects(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1),4326),3857),way) AND osm.building IS NOT NULL"

app.post('/api/buildpercent', jsonParser, async function(req, res) {
	try {
		var values = [req.body];
		
		var result = await client.query(query_buildpercent,values);
		console.log(result.rows);
		res.json(result.rows);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
  }
});


var query_neighboring = "	SELECT \
								 cities.name as name\
							FROM \
								(SELECT name,way \
								FROM planet_osm_polygon \
								WHERE boundary='administrative' AND admin_level='9' AND name IS NOT NULL) as cities \
							JOIN \
								(SELECT way \
								FROM planet_osm_polygon \
								WHERE boundary='administrative' AND admin_level='9' AND osm_id = $1)  as city\
							ON ST_Touches(cities.way,city.way) "
							
var query_poi = "	SELECT 	\
						COUNT(*) as count	\
					FROM planet_osm_point poi	\
					JOIN (	\
						SELECT way 	\
						FROM planet_osm_polygon 	\
						WHERE boundary='administrative' AND admin_level='9' AND osm_id = $1 LIMIT 1)  as city	\
					ON	ST_DWithin(poi.way,city.way,4000)	\
					WHERE 	\
						poi.historic IS NOT NULL OR poi.sport IS NOT NULL"

var query_distance_ba = "	SELECT \
								 ST_Distance(ST_Transform(ba_city.way,2163),ST_Transform(city.way,2163))/1000 AS distance\
							FROM (	\
								SELECT way 	\
								FROM planet_osm_polygon 	\
								WHERE boundary='administrative' AND admin_level='9' AND name='Bratislava - mestská časť Staré Mesto' LIMIT 1) ba_city	\
							CROSS JOIN (	\
								SELECT way 	\
								FROM planet_osm_polygon 	\
								WHERE boundary='administrative' AND admin_level='9' AND osm_id=$1 LIMIT 1)  as city"
								
app.post('/api/description', jsonParser, async function(req, res) {
	try {
		var values = [req.body];
		var result = await client.query(query_neighboring,[values[0].osm_id]);
		var i;
		var cities = "<ul>"
		for(i = 0; i < result.rows.length; ++i) {
				cities += "<li>";
				cities += result.rows[i].name;
				cities += "</li>";
		}
		cities += "</ul>";
		
		var result = await client.query(query_distance_ba,[values[0].osm_id]);
		var distance_ba = result.rows[0].distance;
		
		var result = await client.query(query_poi,[values[0].osm_id]);
		var poi_count = result.rows[0].count;
		
		var results_json = {
			neighboring_cities : cities,
			distance_ba : distance_ba,
			poi_count : poi_count
		};
		res.json(results_json);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
  }
});


app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
})