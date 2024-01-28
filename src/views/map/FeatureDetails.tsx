import { icon } from "@fortawesome/fontawesome-svg-core";
import bearing from "@turf/bearing";
import { LineString, point } from "@turf/helpers";
import { BabsIcon, IconGroups } from "components/BabsIcons";
import { Feature, GeoJsonProperties, Geometry } from "geojson";
import { isEmpty, isUndefined, map, omitBy } from "lodash";
import { SetStateAction, memo, useCallback, useEffect, useState } from "react";
import { CirclePicker } from "react-color";
import { MapRef } from "react-map-gl/maplibre";
import { useDraw, useDrawDispatch } from "./draw/Context";

const calculateIconRotationForLines = (feature: Feature<LineString>): number => {

    // get the first two points of the line to calculate the bearing
    let point1 = point(feature.geometry.coordinates[0])
    let point2 = point(feature.geometry.coordinates[1])

    return bearing(point1, point2) + 90;
}

function FeatureDetail(props: { onUpdate: (e: any) => void, feature: Feature | undefined }) {
    const { feature, onUpdate } = props;
    const [name, setName] = useState<string>((feature && feature.properties && feature.properties.name));
    const [iconEnd, setIconEnd] = useState<string | undefined>((feature && feature.properties && feature.properties.iconEnd));
    const [color, setColor] = useState<string>((feature && feature.properties && feature.properties.color));
    const [kind, setKind] = useState<string>((feature && feature.properties && ((feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString") ? feature.properties.lineType : feature.properties.zoneType)));

    useEffect(() => {
        if (feature && feature.properties) {
            setIconRotation(feature.properties.iconRotation)
            setName(feature.properties.name)
            setIcon(feature.properties.icon)
            setColor(feature.properties.color)
            if ((feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString")) {
                setKind(feature.properties.lineType)
            }
            else if (((feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon"))) {
                setKind(feature.properties.zoneType)
            }
        }
    }, [feature]);

    useEffect(() => {
        if (feature !== undefined) {
            let properties: GeoJsonProperties = Object.assign({}, feature.properties, {
                "icon": icon,
                "iconEnd": iconEnd,
                "color": color,
                "name": name,
                "lineType": feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString" ? kind : undefined,
                "zoneType": feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon" ? kind : undefined,
                "iconRotation": feature.geometry.type === "LineString" ? calculateIconRotationForLines(feature as Feature<LineString>) : iconRotation
            });

            feature.properties = omitBy(properties, isUndefined || isEmpty);
            onUpdate({ features: [feature], action: "featureDetail" });
        }
        return () => onUpdate({ features: [feature] });
    }, [onUpdate, feature, name, color, icon, kind]);

    let selectableTypes: typeof LineTypesMap | typeof ZoneTypesMap | undefined = undefined;

    if (feature?.geometry.type === "LineString" || feature?.geometry.type === "MultiLineString") {
        selectableTypes = LineTypesMap;
    }
    if (feature?.geometry.type === "Polygon" || feature?.geometry.type === "MultiPolygon") {
        selectableTypes = ZoneTypesMap;
    }

    const onTypeChange = useCallback((e: { target: { value: SetStateAction<string>; }; }) => {
        setKind(e.target.value);
        let t = selectableTypes && Object.values(selectableTypes).find(a => a.name === e.target.value);
        if (t && typeof t == IconType) {
            setIcon(t.icon?.name);
        }
        else {
            setIcon("");
        }

    }, [setIcon, selectableTypes])

    return (
        <div>
            < h3 className='title is-size-5' > Eigenschaften</h3 >
            {feature && feature.geometry.type === "Point" &&
                <IconChooser feature={feature} map={map.current} />
            }
            <div className="field is-horizontal">
                <div className="field-label is-normal">
                    <label className="label">Name</label>
                </div>
                <div className="field-body">
                    <div className="field is-expanded">
                        <div className="field">
                            <div className="control">
                                <input className="input" type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <CirclePicker colors={[Colors.Red, Colors.Blue, Colors.Black]} onChangeComplete={(color) => setColor(color.hex)} />
            <br />
            {
                feature && feature.geometry.type !== "Point" && color &&
                <div className="field is-horizontal">
                    <div className="field-label is-normal">
                        <label className="label">Typ</label>
                    </div>
                    <div className="field-body">
                        <div className="field is-expanded">
                            <div className="field">
                                <div className="control">
                                    <div className="select">
                                        <select onChange={onTypeChange}
                                            value={selectableTypes && Object.values(selectableTypes).find(e => e.name === kind)?.name}
                                        >
                                            <option label="Typ wählen">{undefined}</option>
                                            {
                                                selectableTypes && Object.values(selectableTypes).filter(t => t.color === color).map((t: any) => (
                                                    <option key={t.name} label={t.description}>{t.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div >
    )
}

interface ChooserProps {
    feature: Feature<Geometry, GeoJsonProperties>;
    map: MapRef | undefined;
}

function IconChooser(props: ChooserProps) {
    const draw = useDraw();
    const dispatch = useDrawDispatch();

    const { feature, map } = props;
    const [icon, setIcon] = useState<string | undefined>(feature && feature.properties?.icon);
    const [iconRotation, setIconRotation] = useState<number | undefined>(feature && feature.properties?.iconRotation);

    if (draw.selectedFeature === undefined || dispatch === null) {
        return
    }

    return (
        <>
            <div className="field is-horizontal">
                <div className="field-label is-normal">
                    <label className="label">Symbol</label>
                </div >
                <div className="field-body">
                    <div className="field is-expanded">
                        <div className="control">
                            <div className="select">
                                <select onChange={e => dispatch({ action: 'feature/change', feature: { feature } }) value={icon} >
                                    {Object.keys(IconGroups).map((group) => (
                                        <optgroup label={group} key={group}>
                                            {Object.values(IconGroups[group]).map((icon) => (
                                                <option key={icon.name} label={icon.description}>{icon.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div >

                        </div>
                    </div>
                </div>
                < label className="checkbox">
                    <input type="checkbox" onChange={e => e.currentTarget.checked ? setIconRotation(map?.getBearing()) : setIconRotation(undefined)} checked={iconRotation !== undefined} value={iconRotation} />
                    Fixiert
                </label>
            </div >
        </>
    )

}

type IconType = {
    name: string;
    description: string;
    color?: string;
    icon?: BabsIcon;
}

type ZoneType = {
    name: string;
    description: string;
    color?: string;
}

type LineType = {
    name: string;
    description: string;
    color?: string;
}

interface SelectableTypes { [key: string]: IconType | ZoneType | LineType }

const Colors = {
    Red: "#ff0000",
    Blue: "#0000ff",
    Black: '#000000',
}

const ZoneTypesMap: SelectableTypes = {
    "Einsatzraum": {
        name: "Einsatzraum",
        description: "Einsatzraum",
        color: Colors.Blue
    },
    "Schadengebiet": {
        name: "Schadengebiet",
        description: "Schadengebiet",
        color: Colors.Red
    },
    "Brandzone": {
        name: "Brandzone",
        description: "Brandzone",
        color: Colors.Red
    },
    "Zerstoerung": {
        name: "Zerstoerung",
        description: "Zerstörte, unpassierbare Zone",
        color: Colors.Red
    },
};

const LineTypesMap: SelectableTypes = {
    "Rutschgebiet": {
        name: "Rutschgebiet", description: "Rutschgebiet", color: Colors.Red,
    },
    "RutschgebietGespiegelt": {
        name: "RutschgebietGespiegelt", description: "Rutschgebiet (umgekehrt)", color: Colors.Red,
    },
    "begehbar": {
        name: "begehbar", description: "Strasse erschwert befahrbar / begehbar", color: Colors.Red,
    },
    "schwerBegehbar": {
        name: "schwerBegehbar", description: "Strasse nicht befahrbar / schwer Begehbar", color: Colors.Red,
    },
    "unpassierbar": {
        name: "unpassierbar", description: "Strasse unpassierbar / gesperrt", color: Colors.Red,
    },
    "beabsichtigteErkundung": {
        name: "beabsichtigteErkundung", description: "Beabsichtigte Erkundung", color: Colors.Blue,
    },
    "durchgeführteErkundung": {
        name: "durchgeführteErkundung", description: "Durchgeführte Erkundung", color: Colors.Blue,
    },
    "beabsichtigteVerschiebung": {
        name: "beabsichtigteVerschiebung", description: "Beabsichtigte Verschiebung", color: Colors.Blue,
    },
    "rettungsAchse": {
        name: "rettungsAchse", description: "Rettungs Achse", color: Colors.Blue,
    },
    "durchgeführteVerschiebung": {
        name: "durchgeführteVerschiebung", description: "Durchgeführte Verschiebung", color: Colors.Blue,
    },
    "beabsichtigterEinsatz": {
        name: "beabsichtigterEinsatz", description: "Beabsichtigter Einsatz", color: Colors.Blue,
    },
    "durchgeführterEinsatz": {
        name: "durchgeführterEinsatz", description: "Durchgeführter Einsatz", color: Colors.Blue,
    },
};

export default memo(FeatureDetail);