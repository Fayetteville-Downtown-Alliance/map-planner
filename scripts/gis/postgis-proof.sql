-- Isolated evaluation only. No persistent schema or production application migration.
\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE reference_fixture AS
SELECT f->>'id' AS feature_id, 'sandbox'::text AS organization_id,
       ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(f->'raw'), 4326), 2264) AS geom,
       ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(f->'expected'), 4326), 2264) AS expected,
       (f->'reference'->>'startFraction')::double precision AS start_fraction,
       (f->'reference'->>'endFraction')::double precision AS end_fraction
FROM jsonb_array_elements(:'fixture'::jsonb->'lines') AS f;
CREATE INDEX ON reference_fixture USING gist(geom);
DO $$
DECLARE mismatch integer;
BEGIN
  SELECT count(*) INTO mismatch FROM reference_fixture
  WHERE ST_HausdorffDistance(ST_LineSubstring(geom, start_fraction, end_fraction), expected) * 1200/3937 > .02
     OR abs(ST_Length(ST_LineSubstring(geom, start_fraction, end_fraction))/ST_Length(geom) - (end_fraction-start_fraction)) > 1e-8;
  -- Boundary points catch accidental integer division in metre/foot conversions.
  IF NOT ST_DWithin(ST_SetSRID(ST_MakePoint(0,0),2264), ST_SetSRID(ST_MakePoint(82.01,0),2264),25 * 3937.0/1200.0)
     OR ST_DWithin(ST_SetSRID(ST_MakePoint(0,0),2264), ST_SetSRID(ST_MakePoint(82.03,0),2264),25 * 3937.0/1200.0) THEN
    RAISE EXCEPTION '25 metre boundary conversion failed';
  END IF;
  IF mismatch <> 0 OR (SELECT count(*) FROM reference_fixture) <> 2 THEN
    RAISE EXCEPTION 'Source-bound projected substring comparison failed';
  END IF;
  IF abs(ST_X(ST_Transform(ST_SetSRID(ST_MakePoint(-79,33.75),4326),2264)) * 1200/3937 - 609601.22) > .02 THEN
    RAISE EXCEPTION 'US survey foot projection origin failed';
  END IF;
END $$;
-- Synthetic entrances 10m and 100m away. Proximity is a candidate, not a business impact claim.
CREATE TEMP TABLE entrance_fixture AS
SELECT 'near'::text AS id, organization_id,
       ST_Translate(ST_LineInterpolatePoint(geom, .5), 0, 10 * 3937.0/1200.0) AS geom
FROM reference_fixture WHERE feature_id = 'demo-east-curve'
UNION ALL
SELECT 'far', organization_id, ST_Translate(ST_LineInterpolatePoint(geom, .5), 0, 100 * 3937.0/1200.0)
FROM reference_fixture WHERE feature_id = 'demo-east-curve'
UNION ALL
SELECT 'other-tenant', 'other', ST_LineInterpolatePoint(geom, .5)
FROM reference_fixture WHERE feature_id = 'demo-east-curve';
CREATE INDEX ON entrance_fixture USING gist(geom);
DO $$
DECLARE candidates text[];
BEGIN
  SELECT array_agg(e.id ORDER BY e.id) INTO candidates
  FROM reference_fixture r JOIN entrance_fixture e
    ON e.organization_id = r.organization_id AND ST_DWithin(e.geom, r.geom, 25 * 3937.0/1200.0)
  WHERE r.organization_id = 'sandbox' AND r.feature_id = 'demo-east-curve';
  IF candidates IS DISTINCT FROM ARRAY['near']::text[] THEN
    RAISE EXCEPTION 'Scoped 25 metre entrance candidate query failed: %', candidates;
  END IF;
END $$;
-- Planner observation only: a tiny fixture may correctly choose a sequential scan.
EXPLAIN (FORMAT JSON) SELECT e.id FROM entrance_fixture e
WHERE e.organization_id = 'sandbox'
  AND ST_DWithin(e.geom, ST_SetSRID(ST_MakePoint(2035898, 472034), 2264), 25 * 3937.0/1200.0);
SELECT PostGIS_Full_Version();
ROLLBACK;
