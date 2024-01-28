import { Dispatch, ReactNode, createContext, useContext, useReducer } from 'react';

import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { Action } from './actions';
import reducer from './reducer';

interface State {
    features: { [id: string]: Feature<Geometry, GeoJsonProperties> }
    selectedFeature: string | number | undefined;
}

const initialState: State = {
    features: {},
    selectedFeature: undefined
};

const DrawsContext = createContext<State>(initialState);
const DrawsDispatchContext = createContext<Dispatch<Action> | null>(null);


export function DrawProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <DrawsContext.Provider value={state}>
            <DrawsDispatchContext.Provider value={dispatch}>
                {children}
            </DrawsDispatchContext.Provider>
        </DrawsContext.Provider>
    );
}

export function useDraw() {
    return useContext(DrawsContext);
}

export function useDrawDispatch() {
    return useContext(DrawsDispatchContext);
}

