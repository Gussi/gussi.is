use wasm_bindgen::prelude::*;

struct State {
    smooth_cursor_x: f32,
    smooth_cursor_y: f32,
    smooth_scroll: f32,
    smooth_color_temp: f32,
    flow_bias_x: f32,
    flow_bias_y: f32,
}

static mut STATE: Option<State> = None;

const CURSOR_SMOOTH: f32 = 3.0;
const SCROLL_SMOOTH: f32 = 2.0;
const COLOR_SMOOTH: f32 = 2.5;
const INFLUENCE_RADIUS: f32 = 0.25;

#[wasm_bindgen]
pub fn init(_seed: f32) {
    unsafe {
        STATE = Some(State {
            smooth_cursor_x: 0.5,
            smooth_cursor_y: 0.5,
            smooth_scroll: 0.0,
            smooth_color_temp: 0.0,
            flow_bias_x: 0.0,
            flow_bias_y: 0.0,
        });
    }
}

fn lerp_exp(current: f32, target: f32, rate: f32, dt: f32) -> f32 {
    let t = 1.0 - (-rate * dt).exp();
    current + (target - current) * t
}

/// Returns 8 floats: time, cursor_x, cursor_y, scroll, color_temp, flow_x, flow_y, layer_count
#[wasm_bindgen]
pub fn tick(
    dt: f32,
    cursor_x: f32,
    cursor_y: f32,
    scroll_y: f32,
    time: f32,
    is_mobile: bool,
) -> Vec<f32> {
    unsafe {
        let state = STATE.as_mut().expect("call init() first");

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

        let layer_count = if is_mobile { 2.0 } else { 4.0 };

        vec![
            time,
            state.smooth_cursor_x,
            state.smooth_cursor_y,
            state.smooth_scroll,
            state.smooth_color_temp,
            state.flow_bias_x,
            state.flow_bias_y,
            layer_count,
        ]
    }
}
