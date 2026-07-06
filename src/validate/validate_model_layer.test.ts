import {validateStyle} from '../validate_style';
import v8 from '../reference/v8.json' with {type: 'json'};
import {expect, describe, test} from 'vitest';

// The `model` layer type is experimental (native PR4 parity). These tests assert
// the style-spec validator accepts a well-formed model layer, resolves the
// per-type `paint_model`/`layout_model` property groups, and rejects malformed
// input the same way it does for the built-in layer types.

function styleWithModelLayer(layer: any) {
    return {
        version: 8 as const,
        sources: {
            points: {
                type: 'geojson' as const,
                data: {type: 'FeatureCollection' as const, features: []}
            }
        },
        layers: [layer]
    };
}

describe('validate model layer', () => {
    test('accepts a fully specified constant model layer', () => {
        const errors = validateStyle(styleWithModelLayer({
            id: 'buildings',
            type: 'model',
            source: 'points',
            layout: {
                'model-id': 'tower'
            },
            paint: {
                'model-scale': 42,
                'model-rotation': 90,
                'model-footprint': 2,
                'model-opacity': 0.5
            }
        }) as any, v8);
        expect(errors).toEqual([]);
    });

    test('accepts an empty model layer (all properties default)', () => {
        const errors = validateStyle(styleWithModelLayer({
            id: 'm',
            type: 'model',
            source: 'points'
        }) as any, v8);
        expect(errors).toEqual([]);
    });

    test('accepts data-driven expressions on model-id and the data-driven paints', () => {
        const errors = validateStyle(styleWithModelLayer({
            id: 'm',
            type: 'model',
            source: 'points',
            layout: {
                'model-id': ['get', 'model']
            },
            paint: {
                'model-scale': ['get', 'height'],
                'model-rotation': ['get', 'angle'],
                'model-footprint': ['get', 'fp']
            }
        }) as any, v8);
        expect(errors).toEqual([]);
    });

    test('accepts a zoom (camera) expression on the data-constant model-opacity', () => {
        const errors = validateStyle(styleWithModelLayer({
            id: 'm',
            type: 'model',
            source: 'points',
            paint: {
                'model-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0, 16, 1]
            }
        }) as any, v8);
        expect(errors).toEqual([]);
    });

    test('rejects a per-feature expression on the data-constant model-opacity', () => {
        const errors = validateStyle(styleWithModelLayer({
            id: 'm',
            type: 'model',
            source: 'points',
            paint: {
                'model-opacity': ['get', 'o']
            }
        }) as any, v8);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => /model-opacity/.test(e.message))).toBe(true);
    });

    test('rejects a wrong-typed property value', () => {
        const errors = validateStyle(styleWithModelLayer({
            id: 'm',
            type: 'model',
            source: 'points',
            paint: {
                'model-scale': 'big'
            }
        }) as any, v8);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => /model-scale/.test(e.message))).toBe(true);
    });

    test('rejects an out-of-range (negative) model-opacity', () => {
        const errors = validateStyle(styleWithModelLayer({
            id: 'm',
            type: 'model',
            source: 'points',
            paint: {
                'model-opacity': -1
            }
        }) as any, v8);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => /model-opacity/.test(e.message))).toBe(true);
    });

    test('rejects an unknown model paint property', () => {
        const errors = validateStyle(styleWithModelLayer({
            id: 'm',
            type: 'model',
            source: 'points',
            paint: {
                'model-bogus': 5
            }
        }) as any, v8);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => /unknown property "model-bogus"/.test(e.message))).toBe(true);
    });

    test('requires a source', () => {
        const errors = validateStyle({
            version: 8,
            sources: {},
            layers: [{
                id: 'm',
                type: 'model'
            }]
        } as any, v8);
        expect(errors.some((e) => /missing required property "source"/.test(e.message))).toBe(true);
    });
});
