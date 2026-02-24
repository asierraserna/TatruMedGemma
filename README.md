# TatruMedGemma

## Overview
TatruMedGemma is a local LLM-based assistant for medical use. This
repository includes a Flask API, model quantization notebooks, and a
mobile/front-end application.

## Prerequisites

1. **Ollama** – install from https://ollama.com and download the
   MedGemma 1.5 4b model:
   ```sh
   ollama pull medgemma-1.5-4b
   ```
   To run the Ollama service on LAN:
   ```sh
   export OLLAMA_HOST=0.0.0.0:11434 && ollama serve
   ```

2. **Conda environment (`medgemma2`)** – used by the Flask API.
   ```sh
   conda create -n medgemma2 python=3.10
   conda activate medgemma2
   # install dependencies (see requirements-api.txt or use pip/conda as needed)
   ```
   To inspect installed packages run:
   ```sh
   conda list
   ```
   An example package list is included in the appendix below.

## Local Flask (LAN) mode

1. Open `MedGemmaFlaskAPI/MedGemma v2.ipynb` and execute the cells to
   quantize the model. The quantized model will be written to
   `quant-medgemma/`.

2. Start the Flask server with:
   ```sh
   cd MedGemmaFlaskAPI
   LOCAL_MODEL_DIR=./quant-medgemma python api_stable.py
   ```

   The API will serve requests on the local network and use the
   quantized MedGemma model.

## Online prototype

A demonstration of a Gradio-based API running the MedGemma LLM online is
available in a Kaggle notebook:
https://www.kaggle.com/code/alejandrosierraserna/notebookde17c666f6

## Offline option

TBD – we plan to provide instructions for running without network/Ollama
in a future update.

---

# Python package for TatruMedGemma (using Conda in our project)
#
# Name                           Version          Build                 Channel
_libgcc_mutex                    0.1              main
_openmp_mutex                    5.1              1_gnu
accelerate                       1.12.0           pyhcf101f3_0          conda-forge
anyio                            4.10.0           py310h06a4308_0
argon2-cffi                      25.1.0           pyhd8ed1ab_0          conda-forge
argon2-cffi-bindings             25.1.0           py310h7c4b9e2_2       conda-forge
arrow                            1.4.0            pyhcf101f3_0          conda-forge
asttokens                        3.0.1            pyhd8ed1ab_0          conda-forge
async-lru                        2.2.0            pyhcf101f3_0          conda-forge
attrs                            25.4.0           pyhcf101f3_1          conda-forge
babel                            2.18.0           pyhcf101f3_0          conda-forge
beautifulsoup4                   4.14.3           pyha770c72_0          conda-forge
binutils_impl_linux-64           2.45.1           default_hfdba357_101  conda-forge
binutils_linux-64                2.45.1           default_h4852527_101  conda-forge
bitsandbytes                     0.49.2           pypi_0                pypi
blas                             1.0              mkl
bleach                           6.3.0            pyhcf101f3_1          conda-forge
bleach-with-css                  6.3.0            hbca2aae_1            conda-forge
blinker                          1.9.0            pypi_0                pypi
brotlicffi                       1.2.0.0          py310h7354ed3_0
bzip2                            1.0.8            hda65f42_9            conda-forge
ca-certificates                  2026.1.4         hbd8a1cb_0            conda-forge
cached-property                  1.5.2            hd8ed1ab_1            conda-forge
cached_property                  1.5.2            pyha770c72_1          conda-forge
certifi                          2026.01.04       py310h06a4308_0
cffi                             2.0.0            py310h4eded50_1
charset-normalizer               3.4.4            py310h06a4308_0
click                            8.2.1            py310h06a4308_1
comm                             0.2.3            pyhe01879c_0          conda-forge
cuda-cudart                      11.8.89          0                     nvidia
cuda-cupti                       11.8.87          0                     nvidia
cuda-libraries                   11.8.0           0                     nvidia
cuda-nvrtc                       11.8.89          0                     nvidia
cuda-nvtx                        11.8.86          0                     nvidia
cuda-runtime                     11.8.0           0                     nvidia
cuda-version                     12.4             hbda6634_3
debugpy                          1.8.20           py310h25320af_0       conda-forge
decorator                        5.2.1            pyhd8ed1ab_0          conda-forge
defusedxml                       0.7.1            pyhd8ed1ab_0          conda-forge
exceptiongroup                   1.3.1            pyhd8ed1ab_0          conda-forge
executing                        2.2.1            pyhd8ed1ab_0          conda-forge
expat                            2.7.4            h7354ed3_0
ffmpeg                           4.4.0            hca11adc_2            conda-forge
filelock                         3.20.3           py310h06a4308_0
flask                            3.1.3            pypi_0                pypi
flask-cors                       6.0.2            pypi_0                pypi
fqdn                             1.5.1            pyhd8ed1ab_1          conda-forge
freetype                         2.14.1           ha770c72_0            conda-forge
fsspec                           2026.1.0         py310h7040dfc_0
gcc_impl_linux-64                15.2.0           he420e7e_18           conda-forge
gcc_linux-64                     15.2.0           h862fb80_21           conda-forge
giflib                           5.2.2            hd590300_0            conda-forge
gmp                              6.3.0            h6a678d5_0
gmpy2                            2.2.2            py310ha78e65c_0
gnutls                           3.6.13           h85f3911_1            conda-forge
gxx_impl_linux-64                15.2.0           hda75c37_18           conda-forge
gxx_linux-64                     15.2.0           h1fb793f_21           conda-forge
h11                              0.16.0           py310h06a4308_1
hf-xet                           1.2.0            py310h8c4cd34_0
httpcore                         1.0.9            py310h06a4308_0
httpx                            0.28.1           py310h06a4308_1
huggingface_hub                  1.4.1            pyhd8ed1ab_0          conda-forge
icu                              78.2             h33c6efd_0            conda-forge
idna                             3.11             py310h06a4308_0
importlib-metadata               8.7.0            pyhe01879c_1          conda-forge
importlib_resources              6.5.2            pyhd8ed1ab_0          conda-forge
intel-openmp                     2021.4.0         h06a4308_3561
ipykernel                        7.2.0            pyha191276_1          conda-forge
ipython                          8.37.0           pyh8f84b5b_0          conda-forge
ipywidgets                       8.1.8            pyhd8ed1ab_0          conda-forge
isoduration                      20.11.0          pyhd8ed1ab_1          conda-forge
itsdangerous                     2.2.0            pypi_0                pypi
jedi                             0.19.2           pyhd8ed1ab_1          conda-forge
jinja2                           3.1.6            py310h06a4308_0
json5                            0.13.0           pyhd8ed1ab_0          conda-forge
jsonpointer                      3.0.0            pyhcf101f3_3          conda-forge
jsonschema                       4.26.0           pyhcf101f3_0          conda-forge
jsonschema-specifications        2025.9.1         pyhcf101f3_0          conda-forge
jsonschema-with-format-nongpl    4.26.0           hcf101f3_0            conda-forge
jupyter-lsp                      2.3.0            pyhcf101f3_0          conda-forge
jupyter_client                   8.8.0            pyhcf101f3_0          conda-forge
jupyter_core                     5.9.1            pyhc90fa1f_0          conda-forge
jupyter_events                   0.12.0           pyhe01879c_0          conda-forge
jupyter_server                   2.17.0           pyhcf101f3_0          conda-forge
jupyter_server_terminals         0.5.4            pyhcf101f3_0          conda-forge
jupyterlab                       4.5.4            pyhd8ed1ab_0          conda-forge
jupyterlab_pygments              0.3.0            pyhd8ed1ab_2          conda-forge
jupyterlab_server                2.28.0           pyhcf101f3_0          conda-forge
jupyterlab_widgets               3.0.16           pyhcf101f3_1          conda-forge
kernel-headers_linux-64          6.12.0           he073ed8_5            conda-forge
keyutils                         1.6.3            hb9d3cd8_0            conda-forge
krb5                             1.22.2           ha1258a1_0            conda-forge
lame                             3.100            h166bdaf_1003         conda-forge
lark                             1.3.1            pyhd8ed1ab_0          conda-forge
lcms2                            2.18             h0c24ade_0            conda-forge
ld_impl_linux-64                 2.45.1           default_hbd61a6d_101  conda-forge
lerc                             4.0.0            h6a678d5_0
libcublas                        11.11.3.6        0                     nvidia
libcufft                         10.9.0.58        0                     nvidia
libcufile                        1.9.1.3          h99ab3db_1
libcurand                        10.3.5.147       h99ab3db_1
libcusolver                      11.4.1.48        0                     nvidia
libcusparse                      11.7.5.86        0                     nvidia
libdeflate                       1.25             h17f619e_0            conda-forge
libedit                          3.1.20250104     pl5321h7949ede_0      conda-forge
libexpat                         2.7.4            h7354ed3_0
libffi                           3.5.2            h3435931_0            conda-forge
libfreetype                      2.14.1           ha770c72_0            conda-forge
libfreetype6                     2.14.1           h73754d4_0            conda-forge
libgcc                           15.2.0           he0feb66_18           conda-forge
libgcc-devel_linux-64            15.2.0           hcc6f6b0_118          conda-forge
libgcc-ng                        15.2.0           h69a702a_18           conda-forge
libgfortran                      15.2.0           h166f726_7
libgfortran5                     15.2.0           hc633d37_7
libgomp                          15.2.0           he0feb66_18           conda-forge
libjpeg-turbo                    3.1.3            h47b2149_0
liblzma                          5.8.2            hb03c661_0            conda-forge
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