CREATE INDEX planet_osm_point_index ON public.planet_osm_point USING gist(way);
CREATE INDEX point_index_historic ON public.planet_osm_point (historic);
CREATE INDEX point_index_sport ON public.planet_osm_point (sport);
CREATE INDEX planet_osm_polygon_index ON public.planet_osm_polygon USING gist(way);
CREATE INDEX polygon_index_admin_level ON public.planet_osm_polygon (admin_level);
CREATE INDEX polygon_index_admin_name ON public.planet_osm_polygon (name);
CREATE INDEX polygon_index_admin_name ON public.planet_osm_polygon (name);
CREATE INDEX polygon_index_admin_boundary ON public.planet_osm_polygon  (boundary);
CREATE INDEX polygon_index_admin_natural ON public.planet_osm_polygon ("natural");
CREATE INDEX planet_osm_roads_index ON public.planet_osm_roads USING gist(way);
CREATE INDEX roads_index_admin_boundary ON public.planet_osm_roads (railway);



