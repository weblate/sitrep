
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { produce } from "immer";

import { isEqual } from 'lodash';
import { ulid } from 'ulid';
import { Action } from './actions';

interface FeatureMap {
    [id: string]: Feature<Geometry, GeoJsonProperties>
}

function featureReducer(draft: FeatureMap, action: Action) {
    switch (action.type) {
        case 'feature/create': {
            let id = ulid();
            draft[id] = { ...action.payload, id: id, properties: { ...action.payload.properties, createdAt: new Date() } }
            return draft;
        }
        case 'feature/update': {

            if (action.payload.id !== undefined) {
                // make sure the old element is not identical to the current
                if (draft[action.payload.id] && isEqual(draft[action.payload.id], action.payload)
                    && isEqual(draft[action.payload.id]?.properties, action.payload?.properties)) {
                    return draft
                }

                // close the old one
                draft[action.payload.id].properties = { ...draft[action.payload.id].properties, deletedAt: new Date() }
            }
            // generate a new one
            let id = ulid();
            draft[id] = { ...action.payload, id: id, properties: { ...action.payload.properties, createdAt: new Date(), anchestorID: action.payload.id } }
            return draft
        }
        case 'feature/delete': {
            let id = action.payload.id;
            if (id === undefined) {
                return draft
            }
            delete draft[id]
            return draft
        }
        default:
            return draft;
    }
}

function selectedFeatureReducer(draft: string | number | undefined, action: Action) {
    switch (action.type) {
        case 'feature/selectionChange': {
            draft = action.payload?.id
            return draft
        }
        case 'feature/create': {
            draft = undefined
            return draft
        }
        case 'feature/delete': {
            draft = undefined
            return draft
        }
        case 'feature/update': {
            draft = undefined
            return draft
        }
        default:
            return draft;
    }
}

const combineReducers = (slices: any) => (state: any, action: Action) => {
    Object.keys(slices).reduce(
        (acc, prop) => ({
            ...acc,
            [prop]: slices[prop](acc[prop], action),
        }),
        state
    );
}

export default produce(combineReducers({ features: featureReducer, selectedFeature: selectedFeatureReducer }))