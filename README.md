# TatruMedGemma

A multi‑connection medical assistant prototype created for the [Kaggle
MedGemma Impact Challenge](https://www.kaggle.com/competitions/med-gemma-impact-challenge/overview).
The codebase demonstrates on‑device, LAN and online inference with a
privacy‑focused UI.

## Key features

- Text-based conversation with a medical‑domain LLM.
- Analysis of medical images (X‑rays, MRIs) alongside text prompts.
- Text‑to‑speech support for model responses.
- Fully configurable guardrails and inference endpoints.
- Three operating modes: **Offline** (local GGUF model), **LAN**
  (Flask/Ollama), **Online** (Gradio demo).
- Conversations never leave the device unless explicitly exported — no
  backend storage.
- Configurable download URLs for models (Hugging Face default).
- Future roadmap: voice/audio input, enhanced download reliability.

## Distributed intelligence architecture

TatruMedGemma is built on a three‑tiered distributed design that lets
users choose the right balance of privacy, power, and availability.

### Tier 1: Privacy‑First Edge (On‑Device)
- **Model:** MedGemma 1.5 4B (quantized)
- **Engine:** Ollama Mobile Runtime
- **Scope:** Text‑only triage
- **Value:** Zero‑latency, 100 % offline. Ensures that basic medical
  guidance is available even in regions with no internet connectivity.

### Tier 2: Clinical Resource Layer (LAN)
- **Models:** MedGemma 1.5 4B & 27 B
- **Engines:** Ollama (text) & Flask/Transformers (multimodal)
- **Scope:** Enhanced text & image analysis
- **Value:** Leverages local high‑performance workstations within a
  hospital’s secure Wi‑Fi. Keeps sensitive patient imagery (X‑rays,
  dermoscopy) inside the institutional firewall while providing 27B
  reasoning power.

### Tier 3: Global Scale Layer (Public Cloud)
- **Models:** MedGemma 1.5 4B & 27 B (quantized NF4)
- **Engines:** Hugging Face Spaces / Kaggle API
- **Scope:** Full multimodal reasoning
- **Value:** Offers a highly‑available “brain” for remote practitioners.
  NF4 quantization delivers 27B performance on accessible cloud
  hardware, ensuring no doctor is limited by their local equipment.

## Why this project?
Designed as a rapid prototype for the Kaggle competition, TatruMedGemma
showcases a hybrid architecture that keeps sensitive data in the user’s
control while still allowing cloud‑based experimentation. It also
provides quantization notebooks, a Flask API, and an Expo‑based mobile
app with native prebuilds.



## Quick start

### 1. Clone repository
```sh
git clone https://github.com/<your-org>/TatruMedGemma.git
cd TatruMedGemma
```

### 2. Prerequisites
- **Conda environment (`medgemma2`)** with Python 3.10 (see
  `requirements-api.txt`).
- **Ollama** for LAN mode: `ollama pull medgemma-1.5-4b`.
- Expo CLI and Android/iOS tooling for mobile front end.

### 3. Running the system

#### Offline device mode
1. In `TatruMedGemmaApp`, install npm packages and run the app
   (`npx expo start`).
2. In settings, download a GGUF model or supply your own URL.
3. Switch inference provider to **Device** and pick fast/balanced/quality
   mode.

#### LAN mode (Flask + Ollama)
```sh
cd MedGemmaFlaskAPI
LOCAL_MODEL_DIR=./quant-medgemma python api_stable.py
```
Point the mobile/web client at `http://<hostname>:5000`.

#### Online prototype
Open the Kaggle notebook linked above or run `MedGemmaFlaskAPI/api.py`
against an online model.

## Development notes
- Quantization workflow resides in
  `MedGemmaFlaskAPI/MedGemma v2.ipynb`.
- Mobile/native code is under `TatruMedGemmaApp`; the llama binding lives
  in `services/inference/providers/deviceProvider.ts`.
- Guardrail configuration helpers are located in
  `TatruMedGemmaApp/services/guardrails`.

## Privacy
All conversation data stays locally on the device; nothing is sent to any
For developer setup and the full Conda package list, see [CONDA_SETUP.md](CONDA_SETUP.md).
liblzma-devel                    5.8.2            hb03c661_0            conda-forge
libnpp                           11.8.0.86        0                     nvidia
libnsl                           2.0.1            hb9d3cd8_1            conda-forge
libnvjpeg                        11.9.0.86        0                     nvidia
libopenblas                      0.3.31           hf7dbefb_0
libopenjpeg                      2.5.4            hee96239_1
libpng                           1.6.54           hee55ce4_0
libsanitizer                     15.2.0           h90f66d4_18           conda-forge
libsodium                        1.0.20           h4ab18f5_0            conda-forge
libsqlite                        3.51.2           hf4e2dac_0            conda-forge
libstdcxx                        15.2.0           h934c35e_18           conda-forge
libstdcxx-devel_linux-64         15.2.0           hd446a21_118          conda-forge
libstdcxx-ng                     15.2.0           hdf11a46_18           conda-forge
libtiff                          4.7.1            h9d88235_1            conda-forge
libuuid                          2.41.3           h5347b49_0            conda-forge
libvpx                           1.11.0           h9c3ff4c_3            conda-forge
libwebp                          1.6.0            h9635ea4_0            conda-forge
libwebp-base                     1.6.0            hb7bb969_0
libxcb                           1.17.0           h9b100fa_0
libxcrypt                        4.4.36           hd590300_1            conda-forge
libzlib                          1.3.1            hb9d3cd8_2            conda-forge
llvm-openmp                      14.0.6           h9e868ea_0
markupsafe                       3.0.2            py310h5eee18b_0
matplotlib-inline                0.2.1            pyhd8ed1ab_0          conda-forge
mistune                          3.2.0            pyhcf101f3_0          conda-forge
mkl                              2021.4.0         h06a4308_640
mkl-service                      2.4.0            py310h7f8727e_0
mkl_fft                          1.3.1            py310hd6ae3a3_0
mkl_random                       1.2.2            py310h00e6091_0
mpc                              1.3.1            h5eee18b_0
mpfr                             4.2.1            h5eee18b_0
mpmath                           1.3.0            py310h06a4308_0
nbclient                         0.10.4           pyhd8ed1ab_0          conda-forge
nbconvert-core                   7.17.0           pyhcf101f3_0          conda-forge
nbformat                         5.10.4           pyhd8ed1ab_1          conda-forge
ncurses                          6.5              h2d0b736_3            conda-forge
nest-asyncio                     1.6.0            pyhd8ed1ab_1          conda-forge
nettle                           3.6              he412f7d_0            conda-forge
networkx                         3.4.2            py310h06a4308_0
notebook                         7.5.3            pyhcf101f3_0          conda-forge
notebook-shim                    0.2.4            pyhd8ed1ab_1          conda-forge
numpy                            1.24.3           py310hd5efca6_0
numpy-base                       1.24.3           py310h8e6c178_0
nvidia-cublas-cu11               11.11.3.6        pypi_0                pypi
nvidia-cuda-cupti-cu11           11.8.87          pypi_0                pypi
nvidia-cuda-nvrtc-cu11           11.8.89          pypi_0                pypi
nvidia-cuda-runtime-cu11         11.8.89          pypi_0                pypi
nvidia-cudnn-cu11                9.1.0.70         pypi_0                pypi
nvidia-cufft-cu11                10.9.0.58        pypi_0                pypi
nvidia-curand-cu11               10.3.0.86        pypi_0                pypi
nvidia-cusolver-cu11             11.4.1.48        pypi_0                pypi
nvidia-cusparse-cu11             11.7.5.86        pypi_0                pypi
nvidia-nccl-cu11                 2.21.5           pypi_0                pypi
nvidia-nvtx-cu11                 11.8.86          pypi_0                pypi
openh264                         2.1.1            h4ff587b_0
openjpeg                         2.5.4            h4e0627c_1
openssl                          3.6.1            h35e630c_1            conda-forge
overrides                        7.7.0            pyhd8ed1ab_1          conda-forge
packaging                        26.0             pyhcf101f3_0          conda-forge
pandocfilters                    1.5.0            pyhd8ed1ab_0          conda-forge
parso                            0.8.6            pyhcf101f3_0          conda-forge
pexpect                          4.9.0            pyhd8ed1ab_1          conda-forge
pickleshare                      0.7.5            pyhd8ed1ab_1004       conda-forge
pillow                           12.1.1           py310h5a73078_0       conda-forge
pip                              26.0.1           pyhc872135_0
platformdirs                     4.9.2            pyhcf101f3_0          conda-forge
prometheus_client                0.24.1           pyhd8ed1ab_0          conda-forge
prompt-toolkit                   3.0.52           pyha770c72_0          conda-forge
psutil                           7.2.2            py310h139afa4_0       conda-forge
pthread-stubs                    0.4              hb9d3cd8_1002         conda-forge
ptyprocess                       0.7.0            pyhd8ed1ab_1          conda-forge
pure_eval                        0.2.3            pyhd8ed1ab_1          conda-forge
pycparser                        2.23             py310h06a4308_0
pygments                         2.19.2           pyhd8ed1ab_0          conda-forge
pysocks                          1.7.1            py310h06a4308_1
python                           3.10.19          h3c07f61_3_cpython    conda-forge
python-dateutil                  2.9.0.post0      pyhe01879c_2          conda-forge
python-fastjsonschema            2.21.2           pyhe01879c_0          conda-forge
python-json-logger               2.0.7            pyhd8ed1ab_0          conda-forge
python-tzdata                    2025.3           pyhd8ed1ab_0          conda-forge
python_abi                       3.10             8_cp310               conda-forge
pytorch-cuda                     11.8             h7e8668a_6            pytorch
pytorch-mutex                    1.0              cuda                  pytorch
pytz                             2025.2           pyhd8ed1ab_0          conda-forge
pyyaml                           6.0.3            py310h591646f_0
pyzmq                            27.1.0           py310hc4bea81_1       conda-forge
readline                         8.3              hc2a1206_0
referencing                      0.37.0           pyhcf101f3_0          conda-forge
regex                            2025.11.3        py310h47b2149_0
requests                         2.32.5           py310h06a4308_1
rfc3339-validator                0.1.4            pyhd8ed1ab_1          conda-forge
rfc3986-validator                0.1.1            pyh9f0ad1d_0          conda-forge
rfc3987-syntax                   1.1.0            pyhe01879c_1          conda-forge
rpds-py                          0.30.0           py310hd8f68c5_0       conda-forge
safetensors                      0.6.2            py310h498d7c9_0
send2trash                       2.1.0            pyha191276_1          conda-forge
setuptools                       82.0.0           pyh332efcf_0          conda-forge
shellingham                      1.5.4            py310h06a4308_0
six                              1.17.0           pyhe01879c_1          conda-forge
sniffio                          1.3.1            py310h06a4308_0
soupsieve                        2.8.3            pyhd8ed1ab_0          conda-forge
sqlite                           3.51.2           h04a0ce9_0            conda-forge
stack_data                       0.6.3            pyhd8ed1ab_1          conda-forge
sympy                            1.14.0           py310h06a4308_1
sysroot_linux-64                 2.39             hc4b9eeb_5            conda-forge
tbb                              2022.0.0         hdb19cb5_0
tbb-devel                        2022.0.0         hdb19cb5_0
terminado                        0.18.1           pyhc90fa1f_1          conda-forge
tinycss2                         1.4.0            pyhd8ed1ab_0          conda-forge
tk                               8.6.15           h54e0aa7_0
tokenizers                       0.22.2           py310h4551fc8_0       conda-forge
tomli                            2.4.0            pyhcf101f3_0          conda-forge
torch                            2.7.1+cu118      pypi_0                pypi
torchaudio                       2.7.1+cu118      pypi_0                pypi
torchvision                      0.22.1+cu118     pypi_0                pypi
tornado                          6.5.4            py310ha78b2d2_0       conda-forge
tqdm                             4.67.3           py310h7040dfc_1
traitlets                        5.14.3           pyhd8ed1ab_1          conda-forge
transformers                     5.2.0            pyhd8ed1ab_0          conda-forge
triton                           3.3.1            pypi_0                pypi
typer-slim                       0.20.0           py310h06a4308_1
typing-extensions                4.15.0           py310h06a4308_0
typing_extensions                4.15.0           py310h06a4308_0
typing_utils                     0.1.0            pyhd8ed1ab_1          conda-forge
tzdata                           2025c            hc9c84f9_1            conda-forge
uri-template                     1.3.0            pyhd8ed1ab_1          conda-forge
urllib3                          2.6.3            py310h06a4308_0
wcwidth                          0.6.0            pyhd8ed1ab_0          conda-forge
webcolors                        25.10.0          pyhd8ed1ab_0          conda-forge
webencodings                     0.5.1            pyhd8ed1ab_3          conda-forge
websocket-client                 1.9.0            pyhd8ed1ab_0          conda-forge
werkzeug                         3.1.6            pypi_0                pypi
wheel                            0.46.3           py310h06a4308_0
widgetsnbextension               4.0.15           pyhd8ed1ab_0          conda-forge
x264                             1!161.3030       h7f98852_1            conda-forge
xorg-libx11                      1.8.13           he1eb515_0            conda-forge
xorg-libxau                      1.0.12           hb03c661_1            conda-forge
xorg-libxdmcp                    1.1.5            hb03c661_1            conda-forge
xorg-xorgproto                   2025.1           hb03c661_0            conda-forge
xz                               5.8.2            ha02ee65_0            conda-forge
xz-gpl-tools                     5.8.2            ha02ee65_0            conda-forge
xz-tools                         5.8.2            hb03c661_0            conda-forge
yaml                             0.2.5            h7b6447c_0
zeromq                           4.3.5            hb0a5e54_1
zipp                             3.23.0           pyhcf101f3_1          conda-forge
zlib                             1.3.1            hb9d3cd8_2            conda-forge
zlib-ng                          2.3.3            hceb46e0_1            conda-forge
zstd                             1.5.7            hb78ec9c_6            conda-forge