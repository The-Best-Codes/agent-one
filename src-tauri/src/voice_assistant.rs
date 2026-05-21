use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc, Mutex};
use std::time::{Duration, Instant};

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Sample, SizedSample, SupportedStreamConfig};
use futures_util::{SinkExt, StreamExt};
use regex::Regex;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::fs;
use tokio::io::AsyncWriteExt;
use tokio::net::TcpListener;
use tokio::sync::{broadcast, oneshot};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use transcribe_rs::onnx::moonshine::StreamingModel;
use transcribe_rs::onnx::Quantization;
use transcribe_rs::vad::{SileroVad, SmoothedVad, Vad};
use transcribe_rs::{SpeechModel, TranscribeOptions};

const EVENT_NAME: &str = "voice-assistant-test://state";
const MODEL_BASE_URL: &str = "https://download.moonshine.ai/model/medium-streaming-en/quantized";
const MODEL_DIR_NAME: &str = "moonshine-medium-streaming-en";
const VAD_URL: &str = "https://blob.handy.computer/silero_vad_v4.onnx";
const SAMPLE_RATE: u32 = 16_000;
const WAKE_PARTIAL_INTERVAL: Duration = Duration::from_millis(450);
const PARTIAL_MIN_AUDIO_SAMPLES: usize = SAMPLE_RATE as usize / 2;
const ACTIVATION_GRACE_PERIOD: Duration = Duration::from_secs(2);
const SESSION_END_SILENCE: Duration = Duration::from_millis(900);

const MODEL_COMPONENTS: &[&str] = &[
    "adapter.ort",
    "cross_kv.ort",
    "decoder_kv.ort",
    "encoder.ort",
    "frontend.ort",
    "streaming_config.json",
    "tokenizer.bin",
];

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceAssistantSnapshot {
    pub running: bool,
    pub phase: String,
    pub status: String,
    pub transcript: String,
    pub final_transcript: Option<String>,
    pub ws_url: Option<String>,
    pub error: Option<String>,
    pub activated: bool,
}

impl Default for VoiceAssistantSnapshot {
    fn default() -> Self {
        Self {
            running: false,
            phase: "stopped".to_string(),
            status: "Not listening".to_string(),
            transcript: String::new(),
            final_transcript: None,
            ws_url: None,
            error: None,
            activated: false,
        }
    }
}

pub struct VoiceAssistantState {
    snapshot: Arc<Mutex<VoiceAssistantSnapshot>>,
    controller: Mutex<Option<VoiceAssistantController>>,
}

impl Default for VoiceAssistantState {
    fn default() -> Self {
        Self {
            snapshot: Arc::new(Mutex::new(VoiceAssistantSnapshot::default())),
            controller: Mutex::new(None),
        }
    }
}

struct VoiceAssistantController {
    stop_flag: Arc<AtomicBool>,
    websocket: Arc<Mutex<Option<WebSocketServerHandle>>>,
}

struct WebSocketServerHandle {
    url: String,
    sender: broadcast::Sender<String>,
    stop_tx: Option<oneshot::Sender<()>>,
}

struct AssetPaths {
    model_dir: PathBuf,
    vad_path: PathBuf,
}

struct LinearResampler {
    source_rate: u32,
    target_rate: u32,
    buffer: Vec<f32>,
    position: f64,
}

impl LinearResampler {
    fn new(source_rate: u32, target_rate: u32) -> Self {
        Self {
            source_rate,
            target_rate,
            buffer: Vec::new(),
            position: 0.0,
        }
    }

    fn push(&mut self, input: &[f32]) -> Vec<f32> {
        if input.is_empty() {
            return Vec::new();
        }

        if self.source_rate == self.target_rate {
            return input.to_vec();
        }

        self.buffer.extend_from_slice(input);
        let step = self.source_rate as f64 / self.target_rate as f64;
        let mut output = Vec::new();

        while self.position + 1.0 < self.buffer.len() as f64 {
            let index = self.position.floor() as usize;
            let fraction = self.position - index as f64;
            let left = self.buffer[index];
            let right = self.buffer[index + 1];
            output.push(left + ((right - left) * fraction as f32));
            self.position += step;
        }

        let consumed = (self.position.floor() as usize).min(self.buffer.len().saturating_sub(1));
        if consumed > 0 {
            self.buffer.drain(..consumed);
            self.position -= consumed as f64;
        }

        output
    }
}

#[tauri::command]
pub fn start_voice_assistant_test(
    app: AppHandle,
    state: State<'_, VoiceAssistantState>,
) -> Result<VoiceAssistantSnapshot, String> {
    {
        let controller = state
            .controller
            .lock()
            .map_err(|error| format!("failed to lock voice assistant controller: {error}"))?;
        if controller.is_some() {
            return snapshot_clone(&state.snapshot);
        }
    }

    let stop_flag = Arc::new(AtomicBool::new(false));
    let websocket = Arc::new(Mutex::new(None));
    {
        let mut controller = state
            .controller
            .lock()
            .map_err(|error| format!("failed to lock voice assistant controller: {error}"))?;
        *controller = Some(VoiceAssistantController {
            stop_flag: stop_flag.clone(),
            websocket: websocket.clone(),
        });
    }

    set_snapshot(&app, &state.snapshot, |snapshot| {
        *snapshot = VoiceAssistantSnapshot {
            running: true,
            phase: "initializing".to_string(),
            status: "Preparing Moonshine Medium Streaming and microphone access".to_string(),
            transcript: String::new(),
            final_transcript: None,
            ws_url: None,
            error: None,
            activated: false,
        };
    });

    let snapshot = state.snapshot.clone();
    tauri::async_runtime::spawn(async move {
        let result = run_voice_assistant(app.clone(), snapshot.clone(), stop_flag, websocket).await;
        if let Err(error) = result {
            set_snapshot(&app, &snapshot, |current| {
                current.running = false;
                current.phase = "error".to_string();
                current.status = "Voice assistant test failed".to_string();
                current.error = Some(error.clone());
                current.activated = false;
                current.ws_url = None;
            });
        }

        if let Ok(mut controller) = app.state::<VoiceAssistantState>().controller.lock() {
            *controller = None;
        }
    });

    snapshot_clone(&state.snapshot)
}

#[tauri::command]
pub fn stop_voice_assistant_test(
    app: AppHandle,
    state: State<'_, VoiceAssistantState>,
) -> Result<VoiceAssistantSnapshot, String> {
    let controller = state
        .controller
        .lock()
        .map_err(|error| format!("failed to lock voice assistant controller: {error}"))?;

    if let Some(controller) = controller.as_ref() {
        controller.stop_flag.store(true, Ordering::SeqCst);
        stop_websocket_server(&controller.websocket);
        set_snapshot(&app, &state.snapshot, |snapshot| {
            snapshot.running = false;
            snapshot.phase = "stopped".to_string();
            snapshot.status = "Voice assistant stopped".to_string();
            snapshot.transcript.clear();
            snapshot.ws_url = None;
            snapshot.activated = false;
            snapshot.error = None;
        });
    }

    snapshot_clone(&state.snapshot)
}

#[tauri::command]
pub fn get_voice_assistant_test_state(
    state: State<'_, VoiceAssistantState>,
) -> Result<VoiceAssistantSnapshot, String> {
    snapshot_clone(&state.snapshot)
}

async fn run_voice_assistant(
    app: AppHandle,
    snapshot: Arc<Mutex<VoiceAssistantSnapshot>>,
    stop_flag: Arc<AtomicBool>,
    websocket: Arc<Mutex<Option<WebSocketServerHandle>>>,
) -> Result<(), String> {
    let assets = ensure_assets(&app, &snapshot, stop_flag.clone()).await?;
    if stop_flag.load(Ordering::SeqCst) {
        return Ok(());
    }

    tauri::async_runtime::spawn_blocking(move || {
        run_voice_assistant_loop(&app, &snapshot, stop_flag, websocket, assets)
    })
    .await
    .map_err(|error| format!("voice assistant worker task failed: {error}"))?
}

fn run_voice_assistant_loop(
    app: &AppHandle,
    snapshot: &Arc<Mutex<VoiceAssistantSnapshot>>,
    stop_flag: Arc<AtomicBool>,
    websocket: Arc<Mutex<Option<WebSocketServerHandle>>>,
    assets: AssetPaths,
) -> Result<(), String> {
    set_snapshot(app, snapshot, |current| {
        current.phase = "loading-model".to_string();
        current.status = "Loading Moonshine Medium Streaming".to_string();
        current.error = None;
    });

    let mut model = StreamingModel::load(&assets.model_dir, 0, &Quantization::default())
        .map_err(|error| format!("failed to load moonshine streaming model: {error}"))?;

    let silero = SileroVad::new(&assets.vad_path, 0.3)
        .map_err(|error| format!("failed to load silero vad: {error}"))?;
    let mut vad = SmoothedVad::new(Box::new(silero), 15, 15, 2);

    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or_else(|| "no default microphone input device found".to_string())?;
    let config = get_preferred_input_config(&device)?;
    let input_sample_rate = config.sample_rate();
    let channels = config.channels() as usize;
    let (sample_tx, sample_rx) = mpsc::channel::<Vec<f32>>();
    let stream = build_input_stream(&device, &config, channels, sample_tx, stop_flag.clone())
        .map_err(|error| format!("failed to build microphone stream: {error}"))?;

    stream
        .play()
        .map_err(|error| format!("failed to start microphone stream: {error}"))?;

    set_snapshot(app, snapshot, |current| {
        current.phase = "idle".to_string();
        current.status = "Listening in the background for 'agent one'".to_string();
        current.running = true;
        current.error = None;
    });

    let wake_regex = Regex::new(r"(?i)\bagent[\s-]*(?:one|1|won|tone|ton)\b")
        .map_err(|error| format!("failed to compile wake regex: {error}"))?;
    let options = TranscribeOptions::default();
    let frame_size = vad.frame_size();
    let mut resampler = LinearResampler::new(input_sample_rate, SAMPLE_RATE);
    let mut resampled_buffer = Vec::<f32>::new();
    let mut speech_buffer = Vec::<f32>::new();
    let mut last_partial_at = Instant::now();
    let mut session_active = false;
    let mut last_live_text = String::new();
    let mut session_started_at: Option<Instant> = None;
    let mut silence_started_at: Option<Instant> = None;

    while !stop_flag.load(Ordering::SeqCst) {
        let chunk = match sample_rx.recv_timeout(Duration::from_millis(250)) {
            Ok(chunk) => chunk,
            Err(mpsc::RecvTimeoutError::Timeout) => {
                maybe_finalize_session(
                    app,
                    snapshot,
                    &websocket,
                    &mut model,
                    &options,
                    &wake_regex,
                    &mut session_active,
                    &mut session_started_at,
                    &mut silence_started_at,
                    &mut speech_buffer,
                    &mut last_live_text,
                )?;
                continue;
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        };

        let downsampled = resampler.push(&chunk);
        if downsampled.is_empty() {
            continue;
        }

        resampled_buffer.extend_from_slice(&downsampled);
        while resampled_buffer.len() >= frame_size {
            let frame: Vec<f32> = resampled_buffer.drain(..frame_size).collect();
            let was_in_speech = vad.in_speech();
            let is_speech = vad
                .is_speech(&frame)
                .map_err(|error| format!("voice activity detection failed: {error}"))?;
            let onset_prefill = if !was_in_speech && is_speech {
                vad.drain_prefill()
            } else {
                Vec::new()
            };

            if !was_in_speech && is_speech {
                if session_active {
                    speech_buffer.extend_from_slice(&onset_prefill);
                    speech_buffer.extend_from_slice(&frame);
                } else {
                    speech_buffer = onset_prefill;
                    speech_buffer.extend_from_slice(&frame);
                }
                silence_started_at = None;
                last_partial_at = Instant::now() - WAKE_PARTIAL_INTERVAL;
            } else if is_speech && !speech_buffer.is_empty() {
                speech_buffer.extend_from_slice(&frame);
                silence_started_at = None;
            }

            if is_speech
                && !speech_buffer.is_empty()
                && speech_buffer.len() >= PARTIAL_MIN_AUDIO_SAMPLES
                && last_partial_at.elapsed() >= WAKE_PARTIAL_INTERVAL
            {
                let partial = transcribe_samples(&mut model, &speech_buffer, &options)?;
                let cleaned = extract_after_last_wake_phrase(&wake_regex, &partial);

                if session_active {
                    if cleaned != last_live_text {
                        last_live_text = cleaned.clone();
                        set_snapshot(app, snapshot, |current| {
                            current.transcript = cleaned.clone();
                            current.status = if current.transcript.is_empty() {
                                "Wake word heard. Listening for your request".to_string()
                            } else {
                                "Collecting speech after the wake word".to_string()
                            };
                        });
                        broadcast_snapshot(snapshot, &websocket);
                    }
                } else if wake_regex.is_match(&partial) {
                    let ws_url = start_websocket_server(snapshot.clone(), websocket.clone())?;
                    session_active = true;
                    session_started_at = Some(Instant::now());
                    silence_started_at = None;
                    last_live_text = cleaned.clone();
                    set_snapshot(app, snapshot, |current| {
                        current.phase = "active".to_string();
                        current.status = "Wake word detected. Showing glow bar".to_string();
                        current.transcript = cleaned.clone();
                        current.final_transcript = None;
                        current.ws_url = Some(ws_url.clone());
                        current.activated = true;
                        current.error = None;
                    });
                    broadcast_snapshot(snapshot, &websocket);
                }

                last_partial_at = Instant::now();
            }

            if was_in_speech && !is_speech {
                if session_active {
                    silence_started_at = Some(Instant::now());
                } else {
                    speech_buffer.clear();
                }
                last_partial_at = Instant::now();
            }

            maybe_finalize_session(
                app,
                snapshot,
                &websocket,
                &mut model,
                &options,
                &wake_regex,
                &mut session_active,
                &mut session_started_at,
                &mut silence_started_at,
                &mut speech_buffer,
                &mut last_live_text,
            )?;
        }
    }

    stop_websocket_server(&websocket);
    set_snapshot(app, snapshot, |current| {
        current.running = false;
        current.phase = "stopped".to_string();
        current.status = "Voice assistant stopped".to_string();
        current.transcript.clear();
        current.ws_url = None;
        current.activated = false;
        current.error = None;
    });

    Ok(())
}

async fn ensure_assets(
    app: &AppHandle,
    snapshot: &Arc<Mutex<VoiceAssistantSnapshot>>,
    stop_flag: Arc<AtomicBool>,
) -> Result<AssetPaths, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data dir: {error}"))?;
    let model_dir = app_data_dir.join("voice-models").join(MODEL_DIR_NAME);
    let vad_path = app_data_dir.join("voice-models").join("silero_vad_v4.onnx");

    fs::create_dir_all(&model_dir)
        .await
        .map_err(|error| format!("failed to create model directory: {error}"))?;

    for (index, component) in MODEL_COMPONENTS.iter().enumerate() {
        if stop_flag.load(Ordering::SeqCst) {
            return Ok(AssetPaths {
                model_dir,
                vad_path,
            });
        }

        let path = model_dir.join(component);
        if path.exists() {
            continue;
        }

        set_snapshot(app, snapshot, |current| {
            current.status = format!(
                "Downloading Moonshine Medium Streaming component {}/{}",
                index + 1,
                MODEL_COMPONENTS.len()
            );
        });
        download_to_path(&format!("{MODEL_BASE_URL}/{component}"), &path).await?;
    }

    if !vad_path.exists() {
        set_snapshot(app, snapshot, |current| {
            current.status = "Downloading Silero VAD".to_string();
        });
        download_to_path(VAD_URL, &vad_path).await?;
    }

    Ok(AssetPaths {
        model_dir,
        vad_path,
    })
}

async fn download_to_path(url: &str, path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|error| format!("failed to create download directory: {error}"))?;
    }

    let part_path = path.with_extension("part");
    let response = reqwest::get(url)
        .await
        .map_err(|error| format!("failed to download {url}: {error}"))?
        .error_for_status()
        .map_err(|error| format!("failed to download {url}: {error}"))?;
    let mut file = fs::File::create(&part_path)
        .await
        .map_err(|error| format!("failed to create partial file for {url}: {error}"))?;
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|error| format!("failed to read response for {url}: {error}"))?;
        file.write_all(&chunk)
            .await
            .map_err(|error| format!("failed to write partial file for {url}: {error}"))?;
    }

    file.flush()
        .await
        .map_err(|error| format!("failed to flush partial file for {url}: {error}"))?;
    fs::rename(&part_path, path)
        .await
        .map_err(|error| format!("failed to finalize download for {url}: {error}"))?;
    Ok(())
}

fn transcribe_samples(
    model: &mut StreamingModel,
    samples: &[f32],
    options: &TranscribeOptions,
) -> Result<String, String> {
    model
        .transcribe(samples, options)
        .map(|result| result.text.trim().to_string())
        .map_err(|error| format!("transcription failed: {error}"))
}

fn extract_after_last_wake_phrase(regex: &Regex, text: &str) -> String {
    let mut last_end = None;
    for matched in regex.find_iter(text) {
        last_end = Some(matched.end());
    }

    let tail = match last_end {
        Some(end) => &text[end..],
        None => text,
    };

    tail.trim_matches(|character: char| character.is_whitespace() || ",.:;!?-".contains(character))
        .to_string()
}

fn maybe_finalize_session(
    app: &AppHandle,
    snapshot: &Arc<Mutex<VoiceAssistantSnapshot>>,
    websocket: &Arc<Mutex<Option<WebSocketServerHandle>>>,
    model: &mut StreamingModel,
    options: &TranscribeOptions,
    wake_regex: &Regex,
    session_active: &mut bool,
    session_started_at: &mut Option<Instant>,
    silence_started_at: &mut Option<Instant>,
    speech_buffer: &mut Vec<f32>,
    last_live_text: &mut String,
) -> Result<(), String> {
    if !*session_active {
        return Ok(());
    }

    let Some(silence_started) = *silence_started_at else {
        return Ok(());
    };

    if silence_started.elapsed() < SESSION_END_SILENCE {
        return Ok(());
    }

    let within_grace = session_started_at
        .map(|started| started.elapsed() < ACTIVATION_GRACE_PERIOD)
        .unwrap_or(false);
    if within_grace && last_live_text.trim().is_empty() {
        return Ok(());
    }

    let completed = transcribe_samples(model, speech_buffer, options)?;
    let final_text = extract_after_last_wake_phrase(wake_regex, &completed);
    stop_websocket_server(websocket);
    set_snapshot(app, snapshot, |current| {
        current.phase = "idle".to_string();
        current.status = "Listening in the background for 'agent one'".to_string();
        current.transcript.clear();
        current.final_transcript = if final_text.is_empty() {
            None
        } else {
            Some(final_text.clone())
        };
        current.ws_url = None;
        current.activated = false;
        current.error = None;
    });

    *session_active = false;
    *session_started_at = None;
    *silence_started_at = None;
    speech_buffer.clear();
    last_live_text.clear();
    Ok(())
}

fn start_websocket_server(
    snapshot: Arc<Mutex<VoiceAssistantSnapshot>>,
    websocket: Arc<Mutex<Option<WebSocketServerHandle>>>,
) -> Result<String, String> {
    if let Ok(guard) = websocket.lock() {
        if let Some(existing) = guard.as_ref() {
            return Ok(existing.url.clone());
        }
    }

    let server = tauri::async_runtime::block_on(async move {
        let listener = TcpListener::bind("127.0.0.1:0")
            .await
            .map_err(|error| format!("failed to bind websocket server: {error}"))?;
        let address = listener
            .local_addr()
            .map_err(|error| format!("failed to read websocket address: {error}"))?;
        let url = format!("ws://{}", address);
        let (sender, _) = broadcast::channel::<String>(32);
        let (stop_tx, mut stop_rx) = oneshot::channel::<()>();
        let snapshot_for_server = snapshot.clone();
        let sender_for_server = sender.clone();

        tauri::async_runtime::spawn(async move {
            loop {
                tokio::select! {
                    _ = &mut stop_rx => {
                        break;
                    }
                    accepted = listener.accept() => {
                        let (stream, _) = match accepted {
                            Ok(accepted) => accepted,
                            Err(_) => break,
                        };

                        let sender = sender_for_server.clone();
                        let snapshot = snapshot_for_server.clone();
                        tauri::async_runtime::spawn(async move {
                            let websocket_stream = match accept_async(stream).await {
                                Ok(stream) => stream,
                                Err(_) => return,
                            };
                            let (mut write, mut read) = websocket_stream.split();
                            let initial_message = websocket_message(&snapshot);
                            let _ = write.send(Message::Text(initial_message.into())).await;
                            let mut receiver = sender.subscribe();

                            loop {
                                tokio::select! {
                                    message = receiver.recv() => {
                                        match message {
                                            Ok(message) => {
                                                if write.send(Message::Text(message.into())).await.is_err() {
                                                    break;
                                                }
                                            }
                                            Err(_) => break,
                                        }
                                    }
                                    incoming = read.next() => {
                                        match incoming {
                                            Some(Ok(_)) => {}
                                            _ => break,
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
            }
        });

        Ok::<WebSocketServerHandle, String>(WebSocketServerHandle {
            url,
            sender,
            stop_tx: Some(stop_tx),
        })
    })?;

    let url = server.url.clone();
    let mut guard = websocket
        .lock()
        .map_err(|error| format!("failed to lock websocket state: {error}"))?;
    *guard = Some(server);
    Ok(url)
}

fn stop_websocket_server(websocket: &Arc<Mutex<Option<WebSocketServerHandle>>>) {
    if let Ok(mut guard) = websocket.lock() {
        if let Some(mut server) = guard.take() {
            if let Some(stop_tx) = server.stop_tx.take() {
                let _ = stop_tx.send(());
            }
        }
    }
}

fn broadcast_snapshot(
    snapshot: &Arc<Mutex<VoiceAssistantSnapshot>>,
    websocket: &Arc<Mutex<Option<WebSocketServerHandle>>>,
) {
    let message = websocket_message(snapshot);
    if let Ok(guard) = websocket.lock() {
        if let Some(server) = guard.as_ref() {
            let _ = server.sender.send(message);
        }
    }
}

fn websocket_message(snapshot: &Arc<Mutex<VoiceAssistantSnapshot>>) -> String {
    snapshot_clone(snapshot)
        .and_then(|payload| {
            serde_json::to_string(&payload)
                .map_err(|error| format!("failed to serialize websocket payload: {error}"))
        })
        .unwrap_or_else(|_| "{}".to_string())
}

fn set_snapshot(
    app: &AppHandle,
    snapshot: &Arc<Mutex<VoiceAssistantSnapshot>>,
    mutate: impl FnOnce(&mut VoiceAssistantSnapshot),
) -> VoiceAssistantSnapshot {
    let updated = {
        let mut guard = snapshot.lock().unwrap();
        mutate(&mut guard);
        guard.clone()
    };
    let _ = app.emit(EVENT_NAME, &updated);
    updated
}

fn snapshot_clone(
    snapshot: &Arc<Mutex<VoiceAssistantSnapshot>>,
) -> Result<VoiceAssistantSnapshot, String> {
    snapshot
        .lock()
        .map(|guard| guard.clone())
        .map_err(|error| format!("failed to lock voice assistant snapshot: {error}"))
}

fn build_input_stream(
    device: &cpal::Device,
    config: &SupportedStreamConfig,
    channels: usize,
    sample_tx: mpsc::Sender<Vec<f32>>,
    stop_flag: Arc<AtomicBool>,
) -> Result<cpal::Stream, cpal::BuildStreamError> {
    match config.sample_format() {
        cpal::SampleFormat::U8 => {
            build_typed_input_stream::<u8>(device, config, channels, sample_tx, stop_flag)
        }
        cpal::SampleFormat::I8 => {
            build_typed_input_stream::<i8>(device, config, channels, sample_tx, stop_flag)
        }
        cpal::SampleFormat::I16 => {
            build_typed_input_stream::<i16>(device, config, channels, sample_tx, stop_flag)
        }
        cpal::SampleFormat::I32 => {
            build_typed_input_stream::<i32>(device, config, channels, sample_tx, stop_flag)
        }
        cpal::SampleFormat::F32 => {
            build_typed_input_stream::<f32>(device, config, channels, sample_tx, stop_flag)
        }
        sample_format => panic!("unsupported sample format: {sample_format:?}"),
    }
}

fn build_typed_input_stream<T>(
    device: &cpal::Device,
    config: &SupportedStreamConfig,
    channels: usize,
    sample_tx: mpsc::Sender<Vec<f32>>,
    stop_flag: Arc<AtomicBool>,
) -> Result<cpal::Stream, cpal::BuildStreamError>
where
    T: Sample + SizedSample + Send + 'static,
    f32: cpal::FromSample<T>,
{
    device.build_input_stream(
        &config.clone().into(),
        move |data: &[T], _| {
            if stop_flag.load(Ordering::SeqCst) {
                return;
            }

            let mono = if channels == 1 {
                data.iter()
                    .map(|sample| sample.to_sample::<f32>())
                    .collect()
            } else {
                data.chunks_exact(channels)
                    .map(|frame| {
                        frame
                            .iter()
                            .map(|sample| sample.to_sample::<f32>())
                            .sum::<f32>()
                            / channels as f32
                    })
                    .collect()
            };

            let _ = sample_tx.send(mono);
        },
        |_| {},
        None,
    )
}

fn get_preferred_input_config(device: &cpal::Device) -> Result<SupportedStreamConfig, String> {
    let default_config = device
        .default_input_config()
        .map_err(|error| format!("failed to get default input config: {error}"))?;
    let target_rate = default_config.sample_rate();

    let supported_configs = match device.supported_input_configs() {
        Ok(configs) => configs,
        Err(_) => return Ok(default_config),
    };

    let mut best_config = None;
    for config_range in supported_configs {
        if config_range.min_sample_rate() <= target_rate
            && config_range.max_sample_rate() >= target_rate
        {
            match best_config {
                None => best_config = Some(config_range),
                Some(ref current) => {
                    let score = |format: cpal::SampleFormat| match format {
                        cpal::SampleFormat::F32 => 4,
                        cpal::SampleFormat::I16 => 3,
                        cpal::SampleFormat::I32 => 2,
                        _ => 1,
                    };
                    if score(config_range.sample_format()) > score(current.sample_format()) {
                        best_config = Some(config_range);
                    }
                }
            }
        }
    }

    Ok(best_config
        .map(|config| config.with_sample_rate(target_rate))
        .unwrap_or(default_config))
}
