
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

import DefaultMaker from 'assets/marker.svg';
import { AllIcons, LinePatterns, ZonePatterns } from 'components/BabsIcons';
import { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import hat from 'hat';
import { isEqual, unionBy } from 'lodash';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { memo, useCallback, useRef, useState } from 'react';
import { FullscreenControl, Map, MapProvider, MapRef, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { useParams } from 'react-router-dom';
import Notification from 'utils/Notification';
import useLocalStorage from 'utils/useLocalStorage';
import './control-panel.css';
import ExportControl from './controls/ExportControl';
import StyleSwitcherControl from './controls/StyleSwitcherControl';

function MapComponent() {
    const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

    const [viewState, setViewState] = useState({
        latitude: 46.87148,
        longitude: 8.62994,
        zoom: 12,
        bearing: 0,
    });

    const mapRef = useRef<MapRef>(null);

    const { incidentId } = useParams();
    const [features, setFeatures] = useLocalStorage<FeatureCollection>(`map-incident-${incidentId}`, { "type": "FeatureCollection", "features": [], });

    const onCreate = useCallback((e: any) => {
        console.log("[onCreate]", e)
        setFeatures(curFeatureCollection => {
            console.log("[update]: current features created", e)

            const newFeatureCollection = { ...curFeatureCollection };
            const createdFeatures: Feature[] = e.features;
            createdFeatures.forEach(f => {
                if (f.properties) {
                    f.properties['createdAt'] = new Date();
                    newFeatureCollection.features.push(f);
                }
            })

            console.log("Creating feature", createdFeatures)
            newFeatureCollection.features = unionBy(newFeatureCollection.features, curFeatureCollection.features, 'id');
            return newFeatureCollection;
        });
    }, [setFeatures]);

    const onUpdate = useCallback((e: any) => {
        console.log("[onUpdate]", e)

        setFeatures(curFeatureCollection => {
            // an update creates a deleted feature with the old properties and adds a new one with the new properties
            const newFeatureCollection = { ...curFeatureCollection };
            newFeatureCollection.features = []

            const updatedFeatures: Feature[] = e.features;
            const modifiedFeatures: Feature[] = [];
            updatedFeatures.forEach(f => {
                if (f.properties) {

                    // fetch the old element
                    let cur: Feature | undefined = curFeatureCollection.features.find(c => c.id === f.id)
                    // make sure the old element is not identical to the current
                    if (cur && isEqual(cur, f) && isEqual(cur?.properties, f?.properties)) {
                        return;
                    }

                    // if we found the old one and it got changed, close it
                    if (cur && cur.properties) {
                        cur.properties['deletedAt'] = new Date();
                        modifiedFeatures.push(cur);
                    }

                    // generate a new ID and 
                    f.id = hat();
                    f.properties['createdAt'] = new Date();
                    f.properties['achestorID'] = cur?.id;
                    modifiedFeatures.push(f);
                }
            });
            newFeatureCollection.features = [...curFeatureCollection.features, ...modifiedFeatures];

            return newFeatureCollection;
        });
    }, [setFeatures]);

    const onDelete = useCallback((e: any) => {

        setFeatures(curFeatureCollection => {
            const newFeatureCollection = { ...curFeatureCollection };
            const deletedFeatures: Feature[] = e.features;
            deletedFeatures.forEach(f => {
                if (f.properties) {
                    // fetch the old element and close it
                    let cur: Feature | undefined = curFeatureCollection.features.find(c => c.id === f.id)
                    if (cur && cur.properties) {
                        cur.properties['deletedAt'] = new Date();
                        newFeatureCollection.features.push(f);
                    }
                }
            });
            newFeatureCollection.features = unionBy(newFeatureCollection.features, curFeatureCollection.features, 'id');

            return newFeatureCollection;
        });
    }, [setFeatures]);

    // const onCombine = useCallback((e: { createdFeatures: Feature<Geometry, GeoJsonProperties>[]; deletedFeatures: Feature<Geometry, GeoJsonProperties>[]; }) => {
    //     console.log("onCombine", e);
    //     setFeatures(curFeatureCollection => {
    //         const createdFeatures: Feature[] = e.createdFeatures;
    //         const deletedFeatures: Feature[] = e.deletedFeatures;
    //         deletedFeatures.forEach(f => { if (f.properties) { f.properties['deletedAt'] = Date.now() } })
    //         createdFeatures.forEach(f => { if (f.properties) { f.properties['createdAt'] = Date.now() } })

    //         const newFeatureCollection = { ...curFeatureCollection };

    //         // newFeatureCollection.features = pullAllBy(curFeatureCollection.features, deletedFeatures, 'id');
    //         newFeatureCollection.features = unionBy(createdFeatures, newFeatureCollection.features, 'id');
    //         return newFeatureCollection;
    //     });
    // }, [setFeatures]);


    const onSelectionChange = useCallback((e: { features: Feature<Geometry, GeoJsonProperties>[]; }) => {
        const features: Feature[] = e.features;
        if (features.length >= 1) {
            const feature = features[0];
            setSelectedFeature(feature.id);
        }
        else {
            setSelectedFeature(undefined);
        }
    }, [setSelectedFeature]);


    const onMapLoad = useCallback(() => {
        // Add the default marker
        let defaultMarker = new Image(32, 32);
        defaultMarker.onload = () => mapRef && mapRef.current && !mapRef.current.hasImage('default_marker') && mapRef.current.addImage('default_marker', defaultMarker);
        defaultMarker.src = DefaultMaker;

        Object.values(AllIcons).forEach(icon => {
            let customIcon = new Image(48, 48);
            customIcon.onload = () => mapRef && mapRef.current && !mapRef.current.hasImage(icon.name) && mapRef.current.addImage(icon.name, customIcon)
            customIcon.src = icon.src;
        });
        setIsMapLoaded(true);
        mapRef && mapRef.current && mapRef.current.on('styleimagemissing', function (e) {
            const id = e.id; // id of the missing image
            Object.values(Object.assign({}, AllIcons, LinePatterns, ZonePatterns)).filter(icon => id === icon.name).forEach(icon => {
                let customIcon = new Image(icon.size, icon.size);
                customIcon.onload = () => mapRef && mapRef.current && !mapRef.current.hasImage(icon.name) && mapRef.current.addImage(icon.name, customIcon)
                customIcon.src = icon.src;
            });
        });
    }, [setIsMapLoaded, mapRef]);

    return (
        <MapProvider>
            <h3 className="title is-size-3 is-capitalized">Lage</h3>
            <Notification timeout={5000} type={"warning"}>
                <p>Das Lagebild wird nicht mit dem Server synchronisiert, aber lokal gespeichert.</p>
            </Notification>
            <div className='mapbox container-flex'>
                <Map
                    ref={mapRef}
                    mapLib={maplibregl}
                    onLoad={onMapLoad}
                    attributionControl={true}
                    minZoom={8}
                    maxZoom={19}
                    {...viewState}
                    onMove={e => setViewState(e.viewState)}
                    mapStyle={"https://vectortiles.geo.admin.ch/styles/ch.swisstopo.leichte-basiskarte.vt/style.json"}
                >
                    <FullscreenControl position={'top-left'} />
                    <NavigationControl position={'top-left'} visualizePitch={true} />
                    <StyleSwitcherControl position={'bottom-right'} styles={[
                        {
                            title: "Basiskarte",
                            uri: "https://vectortiles.geo.admin.ch/styles/ch.swisstopo.leichte-basiskarte.vt/style.json"
                        },
                        {
                            title: "Satellit",
                            uri: "https://vectortiles.geo.admin.ch/styles/ch.swisstopo.leichte-basiskarte-imagery.vt/style.json"
                        },
                    ]} options={{ eventListeners: { onChange: () => { onMapLoad(); return true } } }} />
                    <ScaleControl unit={"metric"} position={'bottom-left'} />
                    <ExportControl />
                </Map>
            </div>
        </MapProvider>
    );
}

const MemoMap = memo(MapComponent);

export { MemoMap as Map };
