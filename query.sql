-- osm_id example = '-2206974'
-- polygon example = '{"coordinates":[[[17.396888342971664,48.675609488238194],[17.35356858709514,48.66376159570285],[17.343504401392607,48.69409819149374],[17.396888342971664,48.675609488238194]]],"type":"Polygon"}'

-- Query for green cities
SELECT 
	name, 
	osm_id, 
	ST_AsGeoJSON(ST_Centroid(ST_Transform(way, 4326))) as centroid	
FROM (	
	SELECT 	
		cities.name as name,	
		cities.way as way, 	
		cities.osm_id as osm_id, 
		SUM(ST_Area(polygons.way))/ST_Area(cities.way) as nature_perc 	
	FROM 	
		planet_osm_polygon polygons 	
	JOIN (	
		SELECT DISTINCT name,way,osm_id 	
		FROM planet_osm_polygon 	
		WHERE boundary='administrative' AND admin_level='9' AND name IS NOT NULL) as cities	
	ON ST_Contains(cities.way,polygons.way) WHERE polygons.natural IS NOT NULL	
	GROUP BY 1,2,3	
	ORDER BY 4 DESC	
	LIMIT 10) as result;

-- Query for percentage of built-up area
SELECT 
	SUM(ST_Area(ST_Intersection(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1),4326),3857),way)))				\
	   ST_Area(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1),4326),3857))*100	AS result 							
FROM 
	planet_osm_polygon osm 																						
WHERE 
	ST_Intersects(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1),4326),3857),way) 
	AND osm.building IS NOT NULL;
	
-- Query for neighboring cities
SELECT 
	 cities.name as name
FROM (
	SELECT name,way 
	FROM planet_osm_polygon 
	WHERE boundary='administrative' AND admin_level='9' AND name IS NOT NULL ) as cities 
JOIN 
	(SELECT way 
	FROM planet_osm_polygon 
	WHERE boundary='administrative' AND admin_level='9' AND osm_id = $1 )  as city
ON ST_Touches(cities.way,city.way);

-- Query for POI around city
SELECT 	
	COUNT(*) as count	
FROM planet_osm_point poi	
JOIN (	
	SELECT way 	
	FROM planet_osm_polygon 	
	WHERE boundary='administrative' AND admin_level='9' AND osm_id = $1 LIMIT 1 )  as city	
ON	ST_DWithin(poi.way,city.way,4000)	
WHERE 	
	poi.historic IS NOT NULL OR poi.sport IS NOT NULL;
	
-- Query for distance between city and Bratislava
SELECT 
	 ST_Distance(ST_Transform(ba_city.way,2163),ST_Transform(city.way,2163))/1000 AS distance
FROM (	
	SELECT way 	
	FROM planet_osm_polygon 	
	WHERE boundary='administrative' AND admin_level='9' AND name='Bratislava - mestská časť Staré Mesto' LIMIT 1) ba_city	
CROSS JOIN (	
	SELECT way 	
	FROM planet_osm_polygon 	
	WHERE boundary='administrative' AND admin_level='9' AND osm_id=$1 LIMIT 1)  as city
	
-- Query for check if train is in city
SELECT 	
	SUM(ST_Length(osm.way)) as rail_length	
FROM planet_osm_roads osm	
JOIN (
	SELECT way 
	FROM planet_osm_polygon 
	WHERE osm_id = $1 LIMIT 1) as city
ON ST_Intersects(city.way,osm.way)	
WHERE 
	railway = 'rail';