use std::cell::RefCell;
use wasm_bindgen::prelude::*;

struct Rng {
    state: u32,
}

impl Rng {
    fn from_seed(seed: f32) -> Self {
        let bits = seed.to_bits();
        Self {
            state: bits ^ (bits >> 16) ^ 0x9E37_79B9 | 1,
        }
    }

    fn next_f32(&mut self) -> f32 {
        self.state ^= self.state << 13;
        self.state ^= self.state >> 17;
        self.state ^= self.state << 5;
        self.state as f32 / u32::MAX as f32
    }

    fn range(&mut self, min: f32, max: f32) -> f32 {
        min + self.next_f32() * (max - min)
    }
}

struct State {
    smooth_cursor_x: f32,
    smooth_cursor_y: f32,
    smooth_scroll: f32,
    smooth_color_temp: f32,
    flow_bias_x: f32,
    flow_bias_y: f32,
    time_offset: f32,
    smooth_leet_intensity: f32,
}

thread_local! {
    static STATE: RefCell<Option<State>> = const { RefCell::new(None) };
}

const CURSOR_SMOOTH: f32 = 3.0;
const SCROLL_SMOOTH: f32 = 2.0;
const COLOR_SMOOTH: f32 = 2.5;
const LEET_SMOOTH: f32 = 1.2;
const INFLUENCE_RADIUS: f32 = 0.25;
const BASE_LAYER_Y: [f32; 4] = [0.0, 0.1, -0.05, 0.15];

/// Initialize state from seed. Returns visual params for shaders:
/// [phase_x, phase_y, hue_shift, layer_y0..3]
#[wasm_bindgen]
pub fn init(seed: f32) -> Vec<f32> {
    let mut rng = Rng::from_seed(seed);

    let phase_x = rng.range(-2.5, 2.5);
    let phase_y = rng.range(-1.5, 1.5);
    let hue_shift = rng.range(0.0, 1.0);
    let layer_y: [f32; 4] = [
        BASE_LAYER_Y[0] + rng.range(-0.12, 0.12),
        BASE_LAYER_Y[1] + rng.range(-0.12, 0.12),
        BASE_LAYER_Y[2] + rng.range(-0.12, 0.12),
        BASE_LAYER_Y[3] + rng.range(-0.12, 0.12),
    ];
    let time_offset = rng.range(0.0, 180.0);

    STATE.with(|s| {
        *s.borrow_mut() = Some(State {
            smooth_cursor_x: 0.5,
            smooth_cursor_y: 0.5,
            smooth_scroll: 0.0,
            smooth_color_temp: 0.0,
            flow_bias_x: 0.0,
            flow_bias_y: 0.0,
            time_offset,
            smooth_leet_intensity: 0.0,
        });
    });

    vec![
        phase_x,
        phase_y,
        hue_shift,
        layer_y[0],
        layer_y[1],
        layer_y[2],
        layer_y[3],
    ]
}

fn lerp_exp(current: f32, target: f32, rate: f32, dt: f32) -> f32 {
    let t = 1.0 - (-rate * dt).exp();
    current + (target - current) * t
}

fn leet_target(hour: i32, minute: i32) -> f32 {
    if hour == 13 && minute == 37 {
        1.0
    } else {
        0.0
    }
}

/// Returns 9 floats: time, cursor_x, cursor_y, scroll, color_temp, flow_x, flow_y, layer_count, leet_intensity
#[wasm_bindgen]
pub fn tick(
    dt: f32,
    cursor_x: f32,
    cursor_y: f32,
    scroll_y: f32,
    time: f32,
    is_mobile: bool,
    hour: i32,
    minute: i32,
) -> Vec<f32> {
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        let state = state.as_mut().expect("call init() first");

        state.smooth_cursor_x = lerp_exp(state.smooth_cursor_x, cursor_x, CURSOR_SMOOTH, dt);
        state.smooth_cursor_y = lerp_exp(state.smooth_cursor_y, cursor_y, CURSOR_SMOOTH, dt);
        state.smooth_scroll = lerp_exp(state.smooth_scroll, scroll_y, SCROLL_SMOOTH, dt);

        let dx = cursor_x - 0.5;
        let dy = cursor_y - 0.5;
        let dist = (dx * dx + dy * dy).sqrt();
        let influence = (1.0 - (dist / INFLUENCE_RADIUS).min(1.0)).max(0.0);
        let target_color_temp = influence * 0.6;
        state.smooth_color_temp =
            lerp_exp(state.smooth_color_temp, target_color_temp, COLOR_SMOOTH, dt);

        let target_flow_x = dx * influence * 0.08;
        let target_flow_y = dy * influence * 0.05;
        state.flow_bias_x = lerp_exp(state.flow_bias_x, target_flow_x, CURSOR_SMOOTH, dt);
        state.flow_bias_y = lerp_exp(state.flow_bias_y, target_flow_y, CURSOR_SMOOTH, dt);

        let target_leet = leet_target(hour, minute);
        state.smooth_leet_intensity =
            lerp_exp(state.smooth_leet_intensity, target_leet, LEET_SMOOTH, dt);

        let layer_count = if is_mobile { 2.0 } else { 4.0 };

        vec![
            time + state.time_offset,
            state.smooth_cursor_x,
            state.smooth_cursor_y,
            state.smooth_scroll,
            state.smooth_color_temp,
            state.flow_bias_x,
            state.flow_bias_y,
            layer_count,
            state.smooth_leet_intensity,
        ]
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn init_is_deterministic_for_same_seed() {
        let a = init(42.0);
        let b = init(42.0);
        assert_eq!(a, b);
    }

    #[test]
    fn init_varies_across_seeds() {
        let a = init(1.0);
        let b = init(2.0);
        assert_ne!(a, b);
    }

    #[test]
    fn leet_target_only_at_1337() {
        assert_eq!(leet_target(13, 37), 1.0);
        assert_eq!(leet_target(13, 36), 0.0);
        assert_eq!(leet_target(13, 38), 0.0);
        assert_eq!(leet_target(12, 37), 0.0);
    }
}
