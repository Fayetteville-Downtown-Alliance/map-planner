"""Headless PyQGIS interoperability proof. No application, upstream or database writes.
Usage: QT_QPA_PLATFORM=offscreen /usr/bin/python3 scripts/gis/qgis-roundtrip.py test-results/gis
Run in an environment with QGIS's Python bindings (dedicated CI job).
"""
import json
from datetime import datetime
import math
import sys
from pathlib import Path
from qgis.core import (Qgis, QgsApplication, QgsVectorLayer, QgsVectorFileWriter,
                       QgsCoordinateReferenceSystem, QgsCoordinateTransform,
                       QgsPointXY, QgsProject)

root = Path(sys.argv[1]).resolve()
app = QgsApplication([], False)
app.initQgis()
project = QgsProject.instance()
manifest = json.loads((root / 'manifest.json').read_text())
assert manifest['synthetic']
report = {'qgis': Qgis.QGIS_VERSION, 'synthetic': True, 'layers': [], 'projectionToleranceMetres': .02}
# Independent PROJ-backed comparison; this does not certify datum/grid accuracy.
transform = QgsCoordinateTransform(QgsCoordinateReferenceSystem('EPSG:4326'),
                                   QgsCoordinateReferenceSystem('EPSG:2264'), project)
for control in manifest['controlPoints']:
    actual = transform.transform(QgsPointXY(*control['wgs84']))
    delta = math.hypot(actual.x() - control['epsg2264'][0], actual.y() - control['epsg2264'][1]) * 1200 / 3937
    assert delta < .02, f'CRS transform differs by {delta} metres'
assert '+units=us-ft' in QgsCoordinateReferenceSystem('EPSG:2264').toProj()
# Numeric origin proves the US-foot conversion independently of display unit enums.
origin = transform.transform(QgsPointXY(-79, 33.75))
assert abs(origin.x() * 1200 / 3937 - 609601.22) < .02

package = root / 'closures.gpkg'
if package.exists():
    package.unlink()  # Only this script's generated artifact inside its explicit output dir.
for index, name in enumerate(['lines', 'points', 'unmapped']):
    source = root / f'closures-{name}.geojson'
    layer = QgsVectorLayer(str(source), name, 'ogr')
    assert layer.isValid(), f'Invalid source {name}'
    expected = json.loads(source.read_text())['features']
    assert layer.featureCount() == len(expected)
    options = QgsVectorFileWriter.SaveVectorOptions()
    options.driverName = 'GPKG'
    options.layerName = name
    options.actionOnExistingFile = (QgsVectorFileWriter.CreateOrOverwriteFile if index == 0
                                   else QgsVectorFileWriter.CreateOrOverwriteLayer)
    result = QgsVectorFileWriter.writeAsVectorFormatV3(layer, str(package), project.transformContext(), options)
    assert result[0] == QgsVectorFileWriter.NoError, result
    saved = QgsVectorLayer(f'{package}|layername={name}', name, 'ogr')
    assert saved.isValid() and saved.featureCount() == len(expected)
    output = root / f'roundtrip-{name}.geojson'
    options = QgsVectorFileWriter.SaveVectorOptions()
    options.driverName = 'GeoJSON'
    result = QgsVectorFileWriter.writeAsVectorFormatV3(saved, str(output), project.transformContext(), options)
    assert result[0] == QgsVectorFileWriter.NoError, result
    actual = json.loads(output.read_text())['features']
    by_id = {f['properties']['restrictionId']: f for f in actual}
    for feature in expected:
        key = feature['properties']['restrictionId']
        returned = by_id[key]
        for field in ['restrictionId', 'eventId', 'publicationVersion', 'geometryStatus', 'sourceId',
                      'datasetVersion', 'featureId', 'measurementCRS', 'startFraction', 'endFraction',
                      'label', 'referenceId', 'impact', 'status', 'direction', 'sourceUrl', 'detour', 'timeZone']:
            assert returned['properties'].get(field) == feature['properties'].get(field), (key, field)
        for field in ['startsAt', 'endsAt', 'parkingStartsAt', 'startsAtUtc', 'endsAtUtc', 'parkingStartsAtUtc']:
            before_time, after_time = feature['properties'].get(field), returned['properties'].get(field)
            if before_time in [None, '']:
                assert after_time == before_time, (key, field)
            else:
                # OGR adds seconds to minute-resolution local strings. Compare time
                # values and offsets; preserve wall time and UTC semantics explicitly.
                assert datetime.fromisoformat(before_time.replace('Z', '+00:00')) == datetime.fromisoformat(after_time.replace('Z', '+00:00')), (key, field)
        before, after = feature['geometry'], returned['geometry']
        assert (before is None) == (after is None), key
        if before:
            assert before['type'] == after['type']
            first = [before['coordinates']] if before['type'] == 'Point' else before['coordinates']
            second = [after['coordinates']] if after['type'] == 'Point' else after['coordinates']
            assert len(first) == len(second)
            assert all(abs(a-b) < 1e-7 for p, q in zip(first, second) for a, b in zip(p, q)), key
    assert 'PRIVATE' not in output.read_text()
    report['layers'].append({'name': name, 'count': len(actual), 'idsAndProvenance': 'preserved', 'statusAndTimeValues': 'preserved'})
    project.addMapLayer(saved)
project.setCrs(QgsCoordinateReferenceSystem('EPSG:2264'))
assert project.write(str(root / 'engineering-fixture.qgz'))
(root / 'qgis-report.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
# Retain providers until process exit; explicit exitQgis can segfault with live Python layer refs.
