import MapboxDraw from '@mapbox/mapbox-gl-draw';
import EnrichedFeaturesSource from 'components/map/EnrichedFeatures';
import { FeatureCollection } from 'geojson';
import { isEmpty } from 'lodash';
import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl';
import DrawControl from '../controls/DrawControl';
import FeatureDetailControl from '../controls/FeatureDetailControl';
import drawStyle from '../style';
import { useDraw } from './Context';


interface DrawProperties {
    enabled: boolean
}

const modes = {
    ...MapboxDraw.modes,
};

export const DrawMap(props: { props: DrawProperties }) => {
    const map = useMap();
    const [draw, setDraw] = useState<MapboxDraw>();
    const { features, selectedFeature } = useDraw();

    const featureList = Object.values(features);

    useEffect(() => {
        if (!map || !draw || !features || isEmpty(Object.values(features)) {
            return;
        }
        let filteredFC: FeatureCollection = { "type": "FeatureCollection", "features": [] };
        filteredFC.features = featureList.filter(f => f.properties?.deletedAt === undefined)

        draw.set(filteredFC);
    }, [draw, map, features]);


    return (
        <>
            <DrawControl
                position="top-right"
                setDraw={setDraw}
                displayControlsDefault={false}
                styles={drawStyle}
                controls={{
                    polygon: true,
                    trash: true,
                    point: true,
                    line_string: true,
                    combine_features: false,
                    uncombine_features: false,
                }}
                boxSelect={false}
                clickBuffer={10}
                defaultMode="simple_select"
                modes={modes}
                // onCreate={onCreate}
                // onUpdate={onUpdate}
                // onDelete={onDelete}
                // onSelectionChange={onSelectionChange}
                userProperties={true}
            />
            <EnrichedFeaturesSource featureCollection={{ "type": "FeatureCollection", "features": featureList }} selectedFeature={selectedFeature?.id} />
            <FeatureDetailControl feature={featureList.filter(f => f.id === selectedFeature).shift()}>
                <FeatureDetail feature={featureList.filter(f => f.id === selectedFeature).shift()} />
            </FeatureDetailControl>
        </>
    )

}