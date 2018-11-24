CREATE INDEX planet_osm_point_index ON public.planet_osm_point USING gist(way);
CREATE INDEX point_index_historic ON public.planet_osm_point (historic);
CREATE INDEX point_index_sport ON public.planet_osm_point (sport);
CREATE INDEX planet_osm_polygon_index ON public.planet_osm_polygon USING gist(way);
CREATE INDEX point_index_admin_level ON public.planet_osm_polygon USING (admin_level);
CREATE INDEX point_index_admin_name ON public.planet_osm_polygon USING (name);
CREATE INDEX point_index_admin_boundary ON public.planet_osm_polygon USING (boundary);
CREATE INDEX point_index_admin_natural ON public.planet_osm_polygon USING ("natural");
