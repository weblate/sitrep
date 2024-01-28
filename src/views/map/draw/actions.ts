import { Feature, GeoJsonProperties, Geometry } from 'geojson';

type FeatureCreate = { type: 'feature/create'; payload: Feature<Geometry, GeoJsonProperties> };
type FeatureDelete = { type: 'feature/delete'; payload: Feature<Geometry, GeoJsonProperties> };
type FeatureUpdate = { type: 'feature/update'; payload: Feature<Geometry, GeoJsonProperties> };
type FeatureSelectionChange = { type: 'feature/selectionChange'; payload: Feature<Geometry, GeoJsonProperties> | undefined };

export type Action = FeatureCreate | FeatureDelete | FeatureUpdate | FeatureSelectionChange;



