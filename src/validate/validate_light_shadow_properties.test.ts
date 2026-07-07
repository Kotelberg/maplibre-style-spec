import {validateStyleMin} from '../validate_style.min';
import {describe, test, expect} from 'vitest';
import type {StyleSpecification} from '../types.g';

function styleWithLight(light: unknown): StyleSpecification {
    return {
        version: 8,
        sources: {},
        layers: [],
        light
    } as StyleSpecification;
}

describe('light.cast-shadows validation', () => {
    test('accepts a constant boolean (true)', () => {
        const errors = validateStyleMin(styleWithLight({'cast-shadows': true}));
        expect(errors).toHaveLength(0);
    });

    test('accepts the default of false', () => {
        const errors = validateStyleMin(styleWithLight({'cast-shadows': false}));
        expect(errors).toHaveLength(0);
    });

    test('accepts an absent cast-shadows (defaults false)', () => {
        const errors = validateStyleMin(styleWithLight({}));
        expect(errors).toHaveLength(0);
    });

    test('rejects a non-boolean value', () => {
        const errors = validateStyleMin(styleWithLight({'cast-shadows': 'yes'}));
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toMatch(/cast-shadows/);
    });

    test('rejects a number value', () => {
        const errors = validateStyleMin(styleWithLight({'cast-shadows': 1}));
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toMatch(/cast-shadows/);
    });

    test('rejects cast-shadows-transition (transition: false on this property)', () => {
        const errors = validateStyleMin(
            styleWithLight({'cast-shadows': true, 'cast-shadows-transition': {duration: 300}})
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toMatch(/unknown property "cast-shadows-transition"/);
    });
});

describe('light.shadow-intensity validation', () => {
    test('accepts a constant number in range', () => {
        const errors = validateStyleMin(styleWithLight({'shadow-intensity': 0.5}));
        expect(errors).toHaveLength(0);
    });

    test('accepts the default of 0.32', () => {
        const errors = validateStyleMin(styleWithLight({'shadow-intensity': 0.32}));
        expect(errors).toHaveLength(0);
    });

    test('accepts the boundary values 0 and 1', () => {
        expect(validateStyleMin(styleWithLight({'shadow-intensity': 0}))).toHaveLength(0);
        expect(validateStyleMin(styleWithLight({'shadow-intensity': 1}))).toHaveLength(0);
    });

    test('accepts a zoom-interpolated expression', () => {
        const errors = validateStyleMin(
            styleWithLight({'shadow-intensity': ['interpolate', ['linear'], ['zoom'], 14, 0, 16, 0.32]})
        );
        expect(errors).toHaveLength(0);
    });

    test('rejects a value above the maximum', () => {
        const errors = validateStyleMin(styleWithLight({'shadow-intensity': 1.5}));
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toMatch(/shadow-intensity/);
    });

    test('rejects a value below the minimum', () => {
        const errors = validateStyleMin(styleWithLight({'shadow-intensity': -0.1}));
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toMatch(/shadow-intensity/);
    });

    test('rejects a string value', () => {
        const errors = validateStyleMin(styleWithLight({'shadow-intensity': 'dark'}));
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toMatch(/shadow-intensity/);
    });

    test('accepts a shadow-intensity-transition object (transition: true on this property)', () => {
        const errors = validateStyleMin(
            styleWithLight({'shadow-intensity': 0.4, 'shadow-intensity-transition': {duration: 300, delay: 0}})
        );
        expect(errors).toHaveLength(0);
    });

    test('rejects a malformed shadow-intensity-transition', () => {
        const errors = validateStyleMin(
            styleWithLight({'shadow-intensity': 0.4, 'shadow-intensity-transition': {duration: 'fast'}})
        );
        expect(errors.length).toBeGreaterThan(0);
    });
});
