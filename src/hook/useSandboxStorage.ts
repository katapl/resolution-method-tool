import { useEffect, useMemo } from 'react';

export function useSandboxStorage(
    storageKey: string,
    engineState?: any,
    nodes?: any[],
    edges?: any[],
    selectedIds?: string[]
) {
    const initialEngineState = useMemo(() => {
        const raw = localStorage.getItem(`prover_engine_${storageKey}`);
        return raw ? { ...JSON.parse(raw), resolvedPairs: new Set(JSON.parse(raw).resolvedPairs) } : null;
    }, [storageKey]);

    const initialNodes = useMemo(() => JSON.parse(
        localStorage.getItem(`prover_nodes_${storageKey}`) || 'null'
        ), [storageKey]
    );
    const initialEdges = useMemo(() => JSON.parse(
        localStorage.getItem(`prover_edges_${storageKey}`) || 'null'
        ), [storageKey]
    );
    const initialSelected = useMemo(() => JSON.parse(
        localStorage.getItem(`prover_selected_${storageKey}`) || '[]'
        ), [storageKey]
    );

    useEffect(() => {
        if (engineState) {
            const serialized = {
                ...engineState,
                resolvedPairs: Array.from(engineState.resolvedPairs)
            };
            localStorage.setItem(`prover_engine_${storageKey}`, JSON.stringify(serialized));
        }
    }, [engineState, storageKey]);

    useEffect(() => {
        if (nodes && nodes.length > 0) {
            localStorage.setItem(`prover_nodes_${storageKey}`, JSON.stringify(nodes));
        }
    }, [nodes, storageKey]);

    useEffect(() => {
        if (edges && edges.length > 0) {
            localStorage.setItem(`prover_edges_${storageKey}`, JSON.stringify(edges));
        }
    }, [edges, storageKey]);

    useEffect(() => {
        if (selectedIds) {
            localStorage.setItem(`prover_selected_${storageKey}`, JSON.stringify(selectedIds));
        }
    }, [selectedIds, storageKey]);

    return { initialEngineState, initialNodes, initialEdges, initialSelected };
}