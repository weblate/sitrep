import bearing from '@turf/bearing';
import { point } from '@turf/helpers';
import { BabsIcon, Schaeden } from 'components/BabsIcons';
import { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { Layer, Source } from "react-map-gl";




const enrichFeature = (f: Feature<Geometry, GeoJsonProperties>): Feature<Geometry, GeoJsonProperties>[] => {

    if (f === undefined) {
        return []
    }

    let features: Feature<Geometry, GeoJsonProperties>[] = [];

    if (f.geometry.type === "LineString") {
        let enrich: EnrichLineConfig | undefined = EnrichLineStringMap[f.properties?.lineType]
        if (enrich !== undefined) {
            if (enrich.iconStart) {
                let startPoint = point(f.geometry.coordinates[0]);
                startPoint.id = f.id + ":start";
                startPoint.properties = {
                    parent: f.id,
                    icon: enrich.iconStart,
                    iconRotation: bearing(point(f.geometry.coordinates[0]), point(f.geometry.coordinates[1])) + enrich.iconRotation,
                }
                features.push(startPoint)
            }

            if (enrich.iconEnd) {
                let endPoint = point(f.geometry.coordinates.slice(-1)[0]);
                endPoint.id = f.id + ":end";
                endPoint.properties = {
                    parent: f.id,
                    icon: enrich.iconEnd,
                    iconRotation: bearing(f.geometry.coordinates.slice(-1)[0], point(f.geometry.coordinates.slice(-2)[0])) + enrich.iconRotation,
                };
                features.push(endPoint);
            }
        }
    }

    return features
}

type EnrichLineConfig = {
    iconStart?: BabsIcon;
    iconEnd?: BabsIcon;
    iconRotation: number;
}

const EnrichLineStringMap: { [key: string]: EnrichLineConfig } = {
    "begehbar": {
        iconStart: Schaeden.Beschaedigung,
        iconEnd: Schaeden.Beschaedigung,
        iconRotation: 90,
    },
    "schwerBegehbar": {
        iconStart: Schaeden.Teilzerstoerung,
        iconEnd: Schaeden.Teilzerstoerung,
        iconRotation: 90,
    },
    "unpassierbar": {
        iconStart: Schaeden.Totalzerstoerung,
        iconEnd: Schaeden.Totalzerstoerung,
        iconRotation: 90,
    },
    "beabsichtigteErkundung": {
        iconStart: undefined,
        iconEnd: Schaeden.Verschiebung,
        iconRotation: 90,
    },
    "durchgeführteErkundung": {
        iconStart: undefined,
        iconEnd: Schaeden.Verschiebung,
        iconRotation: 90,
    },
    "beabsichtigteVerschiebung": {
        iconStart: undefined,
        iconEnd: Schaeden.Verschiebung,
        iconRotation: 90,
    },
    "rettungsAchse": {
        iconStart: undefined,
        iconEnd: Schaeden.Verschiebung,
        iconRotation: 90,
    },
    "durchgeführteVerschiebung": {
        iconStart: undefined,
        iconEnd: Schaeden.Verschiebung,
        iconRotation: 90,
    },
    "beabsichtigterEinsatz": {
        iconStart: undefined,
        iconEnd: Schaeden.Einsatz,
        iconRotation: 90,
    },
    "durchgeführterEinsatz": {
        iconStart: undefined,
        iconEnd: Schaeden.Einsatz,
        iconRotation: 90,
    },
}



const EnrichedSymbolSource = (props: EnrichedFeaturesProps) => {
    let enrichedFC: FeatureCollection = { "type": "FeatureCollection", "features": [] };
    enrichedFC.features = Object.assign([], props.featureCollection.features.filter(f => f.properties?.deletedAt === undefined).filter(f => f.id !== props.selectedFeature).flatMap(f => enrichFeature(f)))

    return <Source id="enriched" type="geojson" data={enrichedFC} >
        <Layer type="symbol" layout={{
            'icon-image': ['coalesce', ["get", "icon"], 'default_marker'],
            'icon-allow-overlap': true,
            'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 0.1, 17, 1],
            'icon-rotation-alignment': 'map',
            'icon-pitch-alignment': 'map',
            'icon-rotate': ['coalesce', ["get", "iconRotation"], 0]
        }} />
    </Source>
}

export const EnrichedFeaturesSource = (props: EnrichedFeaturesProps) => {

    return <>
        <EnrichedSymbolSource {...props} />
    </>
}

interface EnrichedFeaturesProps {
    featureCollection: FeatureCollection;
    selectedFeature: string | number | undefined
}

export default EnrichedFeaturesSource;